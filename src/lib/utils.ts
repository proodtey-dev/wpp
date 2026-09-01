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

export const DEMO_LEADS: any[] = [];

// Mantém compatibilidade com código antigo
export const BUSINESS_TYPES = NICHE_TYPES.map(n => ({ value: n.value, label: n.label }));
