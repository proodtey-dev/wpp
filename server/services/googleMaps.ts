import { SearchParams, SearchFilters, Lead } from '../types';

const IGNORED_TYPES = [
  'shopping_mall', 'supermarket', 'grocery_store', 'convenience_store',
  'gas_station', 'bus_station', 'transit_station', 'parking', 'locality', 'administrative'
];

// Cache de pageToken por query para paginação real no Google Places (legado v1)
const pageTokenCache: Record<string, string[]> = {};

export const googleMapsService = {
  searchNearby: async (params: SearchParams & { queryText?: string; page?: number }, apiKey: string): Promise<Lead[]> => {
    const page = params.page || 1;
    let nicheQuery = params.type || '';
    if (!nicheQuery || nicheQuery === 'todos') {
      nicheQuery = 'dentista advogado arquiteto fisioterapeuta psicólogo contador';
    }

    const locationPart = params.keyword || params.queryText || 'Goiânia, GO';

    // ── 1. Google Places New API (com chave) ──────────────────────────────
    if (apiKey) {
      try {
        const cacheKey = `${nicheQuery}||${locationPart}`;
        const allResults: Lead[] = [];

        // Fazer até 2 requisições para tentar preencher 20 resultados
        const queries = [
          `${nicheQuery} em ${locationPart}`,
          `${nicheQuery} ${locationPart}`,
        ];

        for (const q of queries) {
          if (allResults.length >= 20) break;
          const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.id,places.primaryType',
            },
            body: JSON.stringify({ textQuery: q, maxResultCount: 20 }),
          });

          if (response.ok) {
            const data = await response.json();
            const places: any[] = (data.places || []).filter(
              (p: any) => !IGNORED_TYPES.includes(p.primaryType)
            );
            for (const place of places) {
              if (allResults.some(r => r.placeId === place.id)) continue; // dedupe
              allResults.push({
                name: place.displayName?.text || 'Empresa',
                address: place.formattedAddress || locationPart,
                phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
                rating: place.rating || null,
                reviewCount: place.userRatingCount || 0,
                website: place.websiteUri || null,
                placeId: place.id,
                photoUrl: null,
                category: place.primaryType || nicheQuery,
                status: 'novo',
              });
              if (allResults.length >= 20) break;
            }
          }
        }

        if (allResults.length > 0) {
          // Paginação simples: fatiar 20 por página
          const start = (page - 1) * 20;
          const slice = allResults.slice(start, start + 20);
          if (slice.length > 0) return slice;
          return allResults; // retorna o que tem se não houver página seguinte
        }
      } catch (error) {
        console.error('Erro ao chamar Google Places API:', error);
      }
    }

    // ── 2. Overpass API (OSM) — busca real de negócios com amenity/shop ───
    const overpassResults = await googleMapsService.searchOverpass(nicheQuery, locationPart, page);
    if (overpassResults.length >= 5) return overpassResults;

    // ── 3. Nominatim como fallback adicional ─────────────────────────────
    const osmResults = await googleMapsService.searchFreeOsm({ ...params, type: nicheQuery, queryText: locationPart, page });
    if (osmResults.length >= 5) return osmResults;

    // ── 4. Dados de demonstração (último recurso) ─────────────────────────
    return googleMapsService.generateHighValueLeads(nicheQuery, locationPart, page);
  },

  // Overpass API: busca negócios reais no OpenStreetMap com amenity tags
  searchOverpass: async (type: string, location: string, page: number = 1): Promise<Lead[]> => {
    try {
      // Geocodificar a localização
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'WhatsAppProspectorApp/1.0' } }
      );
      const geoData = await geoRes.json();
      if (!geoData?.[0]) return [];

      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);
      const radiusM = 15000; // 15 km

      // Mapear tipo de nicho para tags OSM
      const osmTags = getOsmTags(type);

      // Montar query Overpass com múltiplas tags
      const tagFilters = osmTags.map(tag => `
        node[${tag}](around:${radiusM},${lat},${lon});
        way[${tag}](around:${radiusM},${lat},${lon});
      `).join('');

      const overpassQuery = `
        [out:json][timeout:25];
        (${tagFilters});
        out body center 60;
      `;

      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!overpassRes.ok) return [];

      const overpassData = await overpassRes.json();
      const elements: any[] = overpassData.elements || [];

      const ddd = getDDD(location);

      const leads: Lead[] = elements
        .filter((el: any) => el.tags?.name)
        .map((el: any, idx: number) => {
          const tags = el.tags || {};
          const phone = (tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '').replace(/\D/g, '');
          const website = tags.website || tags['contact:website'] || null;
          const lat2 = el.lat || el.center?.lat;
          const lon2 = el.lon || el.center?.lon;
          const placeId = `osm-${el.id}-p${page}`;
          return {
            name: tags.name || `Empresa ${idx + 1}`,
            address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || location,
            phone: phone.length >= 8 ? phone : null,
            rating: null,
            reviewCount: 0,
            website,
            placeId,
            photoUrl: null,
            category: type,
            status: 'novo',
          };
        });

      // Paginação: 20 por página
      const start = (page - 1) * 20;
      return leads.slice(start, start + 20);
    } catch (e) {
      console.error('Erro Overpass:', e);
      return [];
    }
  },

  searchFreeOsm: async (params: SearchParams & { queryText?: string; page?: number }): Promise<Lead[]> => {
    try {
      const locationPart = params.queryText || params.keyword || 'Goiânia, GO';
      const typePart = params.type || 'dentista';
      const page = params.page || 1;
      const fullQuery = `${typePart} ${locationPart}`;

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&extratags=1&limit=50`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'WhatsAppProspectorApp/1.0 (contact@prospector.app)' }
      });

      if (!response.ok) return [];

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) return [];

      const ddd = getDDD(locationPart);

      const validLeads = results
        .filter((item: any) => !IGNORED_TYPES.includes(item.type) && item.display_name)
        .map((item: any, idx: number) => {
          const extractedPhone = item.extratags?.phone || item.extratags?.['contact:phone'] || item.extratags?.['contact:mobile'];
          const phone = extractedPhone ? extractedPhone.replace(/\D/g, '') : null;
          const website = item.extratags?.website || item.extratags?.['contact:website'] || null;
          return {
            name: item.display_name.split(',')[0] || typePart,
            address: item.display_name.split(',').slice(0, 3).join(','),
            phone,
            rating: null,
            reviewCount: 0,
            website,
            placeId: `osm-nom-${item.place_id}-p${page}`,
            photoUrl: null,
            category: typePart,
            status: 'novo',
          };
        });

      const start = (page - 1) * 20;
      return validLeads.slice(start, start + 20);
    } catch (error) {
      console.error('Erro na busca OSM:', error);
      return [];
    }
  },

  // Gerador de demonstração — só usado se todas as APIs falharem
  generateHighValueLeads: (type: string, location: string, page: number = 1): Lead[] => {
    const ddd = getDDD(location);
    const city = location.split(',')[0] || 'Goiânia';

    const presets = [
      `Clínica ${type} Centro`, `${type} Especializado ${city}`, `Studio ${type} Premium`,
      `${type} Dr. Silva`, `${type} Dra. Costa`, `Espaço ${type} Saúde`,
      `${type} & Associados`, `Consultório ${type} Central`, `${type} Moderno`,
      `${type} Ltda.`, `${type} Profissional`, `${type} Elite`,
      `${type} Avançado`, `${type} Integrado`, `${type} Especialista`,
      `${type} Referência`, `${type} Top`, `${type} Prime`,
      `${type} Expert`, `${type} Master`,
    ];

    const offset = (page - 1) * 20;
    return presets.map((name, i) => ({
      name: `${name} #${offset + i + 1}`,
      address: `Rua ${i + 1 + offset}, ${100 + i * 10} - ${city}`,
      phone: null,
      rating: null,
      reviewCount: 0,
      website: null,
      placeId: `demo-p${page}-${i}`,
      photoUrl: null,
      category: type,
      status: 'novo',
    }));
  },

  filterResults: (leads: Lead[], filters: SearchFilters): Lead[] => {
    return leads.filter(lead => {
      if (filters.noWebsite && lead.website && lead.website.trim().length > 0) return false;
      if (filters.hasPhone && (!lead.phone || lead.phone.trim().length === 0)) return false;
      return true;
    });
  },

  getPhotoUrl: (photoName: string, apiKey: string): string => {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=400`;
  },

  geocode: async (query: string, apiKey?: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'WhatsAppProspectorApp/1.0' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      }
    } catch {}
    return { latitude: -16.6869, longitude: -49.2648 };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDDD(location: string): string {
  if (location.includes('GO') || location.includes('Goiânia') || location.includes('Goiania')) return '62';
  if (location.includes('SP') || location.includes('São Paulo') || location.includes('Sao Paulo')) return '11';
  if (location.includes('RJ') || location.includes('Rio de Janeiro')) return '21';
  if (location.includes('MG') || location.includes('Belo Horizonte')) return '31';
  if (location.includes('BA') || location.includes('Salvador')) return '71';
  if (location.includes('PR') || location.includes('Curitiba')) return '41';
  if (location.includes('RS') || location.includes('Porto Alegre')) return '51';
  if (location.includes('PE') || location.includes('Recife')) return '81';
  if (location.includes('CE') || location.includes('Fortaleza')) return '85';
  if (location.includes('AM') || location.includes('Manaus')) return '92';
  return '62';
}

function getOsmTags(type: string): string[] {
  const t = type.toLowerCase();
  if (t.includes('dent') || t.includes('odont')) return ['"amenity"="dentist"', '"healthcare"="dentist"'];
  if (t.includes('adv') || t.includes('law')) return ['"office"="lawyer"', '"office"="attorney"'];
  if (t.includes('fisio')) return ['"healthcare"="physiotherapist"', '"amenity"="physiotherapist"'];
  if (t.includes('psic')) return ['"healthcare"="psychotherapist"', '"healthcare"="psychologist"'];
  if (t.includes('arqu')) return ['"office"="architect"'];
  if (t.includes('cont') || t.includes('account')) return ['"office"="accountant"', '"office"="tax_advisor"'];
  if (t.includes('imob') || t.includes('real_estate')) return ['"office"="estate_agent"'];
  if (t.includes('cabel') || t.includes('hair') || t.includes('salon')) return ['"shop"="hairdresser"', '"amenity"="hairdresser"'];
  if (t.includes('estet') || t.includes('spa') || t.includes('beauty')) return ['"shop"="beauty"', '"amenity"="beauty_salon"'];
  if (t.includes('vet')) return ['"amenity"="veterinary"'];
  if (t.includes('gym') || t.includes('personal')) return ['"leisure"="fitness_centre"', '"amenity"="gym"'];
  if (t.includes('eletri')) return ['"craft"="electrician"'];
  if (t.includes('encan') || t.includes('plumb')) return ['"craft"="plumber"'];
  // Genérico — retorna clínicas e escritórios
  return ['"amenity"="clinic"', '"amenity"="doctors"', '"office"="company"'];
}
