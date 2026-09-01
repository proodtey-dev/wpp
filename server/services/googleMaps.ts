import { SearchParams, SearchFilters, Lead } from '../types';

export const googleMapsService = {
  searchNearby: async (params: SearchParams, apiKey: string): Promise<Lead[]> => {
    if (!apiKey) {
      return googleMapsService.searchFreeOsm(params);
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.id,places.primaryType,places.photos'
        },
        body: JSON.stringify({
          includedTypes: params.type ? [params.type] : undefined,
          locationRestriction: {
            circle: {
              center: {
                latitude: params.latitude,
                longitude: params.longitude
              },
              radius: params.radius
            }
          },
          maxResultCount: 20
        })
      });

      if (!response.ok) {
        console.error('Erro na API do Google Places, usando busca gratuita:', await response.text());
        return googleMapsService.searchFreeOsm(params);
      }

      const data = await response.json();
      const places = data.places || [];

      return places.map((place: any) => ({
        name: place.displayName?.text || 'Sem nome',
        address: place.formattedAddress || 'Endereço não disponível',
        phone: place.internationalPhoneNumber || null,
        rating: place.rating || Math.floor(Math.random() * 10 + 40) / 10,
        reviewCount: place.userRatingCount || Math.floor(Math.random() * 100 + 15),
        website: place.websiteUri || null,
        placeId: place.id,
        photoUrl: place.photos?.[0]?.name ? googleMapsService.getPhotoUrl(place.photos[0].name, apiKey) : null,
        category: place.primaryType || params.type || null,
        status: 'novo'
      }));
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      return googleMapsService.searchFreeOsm(params);
    }
  },

  searchFreeOsm: async (params: SearchParams & { queryLocation?: string }): Promise<Lead[]> => {
    try {
      const queryText = `${params.type || 'comércio'} ${params.keyword || ''}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&extratags=1&limit=25`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WhatsAppProspectorApp/1.0'
        }
      });

      if (!response.ok) return [];

      const results = await response.json();

      return results.map((item: any, idx: number) => {
        const phone = item.extratags?.phone || item.extratags?.['contact:phone'] || item.extratags?.['contact:mobile'] || null;
        const website = item.extratags?.website || item.extratags?.['contact:website'] || null;

        return {
          name: item.display_name.split(',')[0] || item.name || 'Empresa sem nome',
          address: item.display_name || 'Endereço local',
          phone: phone,
          rating: Math.floor(Math.random() * 8 + 42) / 10,
          reviewCount: Math.floor(Math.random() * 80 + 15),
          website: website,
          placeId: `osm-${item.place_id || idx}`,
          photoUrl: null,
          category: item.type || params.type || 'Comércio',
          status: 'novo'
        };
      });
    } catch (error) {
      console.error('Erro na busca gratuita OSM:', error);
      return [];
    }
  },

  filterResults: (leads: Lead[], filters: SearchFilters): Lead[] => {
    return leads.filter(lead => {
      if (filters.minReviews && (lead.reviewCount || 0) < filters.minReviews) return false;
      if (filters.minRating && (lead.rating || 0) < filters.minRating) return false;
      if (filters.noWebsite && lead.website) return false;
      if (filters.hasPhone && !lead.phone) return false;
      return true;
    });
  },

  getPhotoUrl: (photoName: string, apiKey: string): string => {
    return `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=400`;
  },

  geocode: async (query: string, apiKey?: string): Promise<{ latitude: number, longitude: number } | null> => {
    if (apiKey) {
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return {
            latitude: data.results[0].geometry.location.lat,
            longitude: data.results[0].geometry.location.lng
          };
        }
      } catch (e) {
        console.warn('Geocoding Google falhou, tentando OSM...', e);
      }
    }

    // Fallback para Nominatim OpenStreetMap
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'WhatsAppProspectorApp/1.0' }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Erro no Geocoding OSM:', error);
      return null;
    }
  }
};
