export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatPhone(phone: string) {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Nichos com alto valor e alta necessidade de site profissional
export const NICHE_TYPES = [
  { value: 'dentist', label: 'Dentista', emoji: '🦷', googleType: 'dentist' },
  { value: 'lawyer', label: 'Advogado', emoji: '⚖️', googleType: 'lawyer' },
  { value: 'hair_care', label: 'Cabelereiro', emoji: '✂️', googleType: 'hair_care' },
  { value: 'architect', label: 'Arquiteto', emoji: '📐', googleType: 'architect' },
  { value: 'physiotherapist', label: 'Fisioterapeuta', emoji: '💆', googleType: 'physiotherapist' },
  { value: 'psychologist', label: 'Psicólogo', emoji: '🧠', googleType: 'psychologist' },
  { value: 'accountant', label: 'Contador', emoji: '📊', googleType: 'accounting' },
  { value: 'real_estate_agency', label: 'Imobiliária', emoji: '🏠', googleType: 'real_estate_agency' },
  { value: 'veterinary_care', label: 'Veterinário', emoji: '🐾', googleType: 'veterinary_care' },
  { value: 'gym', label: 'Personal Trainer', emoji: '💪', googleType: 'gym' },
  { value: 'insurance_agency', label: 'Corretor Seg.', emoji: '🛡️', googleType: 'insurance_agency' },
  { value: 'electrician', label: 'Eletricista', emoji: '⚡', googleType: 'electrician' },
  { value: 'plumber', label: 'Encanador', emoji: '🔧', googleType: 'plumber' },
  { value: 'beauty_salon', label: 'Salão de Beleza', emoji: '💅', googleType: 'beauty_salon' },
  { value: 'spa', label: 'Estética', emoji: '✨', googleType: 'spa' },
  { value: 'tutoring', label: 'Professor Particular', emoji: '📚', googleType: 'tutoring_service' },
];

// Mensagem de prospecção — proposta de valor clara: sem risco, paga só depois
export const DEFAULT_MESSAGE = `Olá {nome}, tudo bem?

Sou desenvolvedor web e vi que vocês ainda não têm um site profissional.

Tenho uma proposta diferente: *crio o site completo para vocês sem nenhum custo inicial*. Você só paga depois de ver o resultado pronto e aprovado — sem risco nenhum.

Um site profissional pode trazer muito mais clientes para {nome}, especialmente pelo Google. Posso te mostrar alguns exemplos?

Abraço! 😊`;

// Leads de demonstração — nichos profissionais de alto valor
export const DEMO_LEADS = [
  {
    id: 1,
    name: 'Dra. Ana Paula Dentista',
    type: 'Dentista',
    rating: 4.9,
    reviews: 87,
    address: 'Rua das Flores, 321 - Pinheiros, São Paulo, SP',
    phone: '11987654321',
    hasWebsite: false,
    status: 'novo',
    emoji: '🦷',
  },
  {
    id: 2,
    name: 'Escritório Alves & Souza Advogados',
    type: 'Advogado',
    rating: 4.7,
    reviews: 43,
    address: 'Av. Paulista, 1800 - Bela Vista, São Paulo, SP',
    phone: '11933334444',
    hasWebsite: false,
    status: 'novo',
    emoji: '⚖️',
  },
  {
    id: 3,
    name: 'Studio Carla Hair',
    type: 'Cabelereiro',
    rating: 4.8,
    reviews: 156,
    address: 'Rua Augusta, 400 - Consolação, São Paulo, SP',
    phone: '11955556666',
    hasWebsite: false,
    status: 'novo',
    emoji: '✂️',
  },
  {
    id: 4,
    name: 'ArquiDesign - Pedro Mendes',
    type: 'Arquiteto',
    rating: 5.0,
    reviews: 29,
    address: 'Rua Oscar Freire, 700 - Jardins, São Paulo, SP',
    phone: '11977778888',
    hasWebsite: false,
    status: 'novo',
    emoji: '📐',
  },
  {
    id: 5,
    name: 'Clínica Fisio Bem Estar',
    type: 'Fisioterapeuta',
    rating: 4.6,
    reviews: 64,
    address: 'Av. Brasil, 500 - Centro, Curitiba, PR',
    phone: '41988889999',
    hasWebsite: false,
    status: 'novo',
    emoji: '💆',
  },
  {
    id: 6,
    name: 'Dra. Marina Psicóloga',
    type: 'Psicólogo',
    rating: 4.9,
    reviews: 31,
    address: 'Rua das Laranjeiras, 120 - Belo Horizonte, MG',
    phone: '31966667777',
    hasWebsite: false,
    status: 'novo',
    emoji: '🧠',
  },
  {
    id: 7,
    name: 'ContaFácil - Escritório Contábil',
    type: 'Contador',
    rating: 4.5,
    reviews: 52,
    address: 'Av. Rio Branco, 150 - Centro, Rio de Janeiro, RJ',
    phone: '21944445555',
    hasWebsite: false,
    status: 'novo',
    emoji: '📊',
  },
  {
    id: 8,
    name: 'Imobiliária Lar Feliz',
    type: 'Imobiliária',
    rating: 4.4,
    reviews: 98,
    address: 'Rua XV de Novembro, 800 - Centro, Florianópolis, SC',
    phone: '48922223333',
    hasWebsite: false,
    status: 'novo',
    emoji: '🏠',
  },
  {
    id: 9,
    name: 'Vet Pet - Dr. Carlos',
    type: 'Veterinário',
    rating: 4.8,
    reviews: 201,
    address: 'Av. Ipiranga, 300 - Porto Alegre, RS',
    phone: '51911112222',
    hasWebsite: false,
    status: 'novo',
    emoji: '🐾',
  },
  {
    id: 10,
    name: 'Beauty Spa Renata',
    type: 'Estética',
    rating: 4.7,
    reviews: 118,
    address: 'Rua da Paz, 55 - Meireles, Fortaleza, CE',
    phone: '85999990000',
    hasWebsite: false,
    status: 'novo',
    emoji: '✨',
  },
  {
    id: 11,
    name: 'Eng. João - Reformas e Construção',
    type: 'Engenheiro',
    rating: 4.6,
    reviews: 37,
    address: 'Av. Goiás, 1200 - Goiânia, GO',
    phone: '62988887777',
    hasWebsite: false,
    status: 'novo',
    emoji: '🏗️',
  },
  {
    id: 12,
    name: 'Salão Luxo - Beleza Premium',
    type: 'Salão de Beleza',
    rating: 4.9,
    reviews: 273,
    address: 'Rua das Palmeiras, 900 - Recife, PE',
    phone: '81977776666',
    hasWebsite: false,
    status: 'novo',
    emoji: '💅',
  },
];

// Mantém compatibilidade com código antigo
export const BUSINESS_TYPES = NICHE_TYPES.map(n => ({ value: n.value, label: n.label }));
