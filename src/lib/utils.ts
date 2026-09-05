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

Sou desenvolvedor de sites e notei que vocês ainda não possuem um site profissional.

Tenho uma proposta sem risco para você: eu crio a estrutura completa do site, te envio para você avaliar e você só paga após aprovar o resultado final!

Posso criar o seu site sem compromisso?`;

export const TEMPLATE_MESSAGES: Record<string, string> = {
  contabilidade: `Olá {nome}, boa tarde, tudo bem?

Percebi que você ainda não possui um site corporativo, e ter uma plataforma online transmite muito mais credibilidade para atrair empresas que buscam serviços de contabilidade.

Consigo fazer o site gratuitamente e você só paga R$ 200,00 após aprovar o resultado, o que acha?

Caso queira, posso te mandar um exemplo de site na área de contabilidade que eu mesmo já fiz para você dar uma olhada?`,

  odonto: `Olá {nome}, boa tarde, tudo bem?

Percebi que a sua clínica ainda não possui um site profissional, e ter uma página moderna ajuda muito a atrair novos pacientes para agendar consultas pelo WhatsApp.

Consigo fazer o site gratuitamente e você só paga R$ 200,00 após aprovar o resultado, o que acha?

Caso queira, posso te mandar um exemplo de site na área de odontologia que eu mesmo já fiz para você dar uma olhada?`,

  advocacia: `Olá {nome}, boa tarde, tudo bem?

Percebi que você ainda não possui um site profissional para o seu escritório, e ter uma presença online ajuda muito a trazer novos clientes que buscam por advogados no Google.

Consigo fazer o site gratuitamente e você só paga R$ 200,00 após aprovar o resultado, o que acha?

Caso queira, posso te mandar um exemplo de site na área de advocacia que eu mesmo já fiz para você dar uma olhada?`,

  arquiteto: `Olá {nome}, boa tarde, tudo bem?

Percebi que você ainda não possui um site de portfólio, e ter uma página online ajuda muito a mostrar seus projetos finalizados e fechar novos orçamentos de alto valor.

Consigo fazer o site gratuitamente e você só paga R$ 200,00 após aprovar o resultado, o que acha?

Caso queira, posso te mandar um exemplo de site na área de arquitetura e reformas que eu mesmo já fiz para você dar uma olhada?`
};

export function detectNicheTemplate(lead?: { name?: string; category?: string; type?: string }): string {
  if (!lead) return 'arquiteto';
  const text = `${lead.category || ''} ${lead.type || ''} ${lead.name || ''}`.toLowerCase();

  if (/contab|contad|consultant|corporate_office|accounting|fiscal|tribut/.test(text)) return 'contabilidade';
  if (/odonto|dentist|dente|ortodon|sorriso|clinic/.test(text)) return 'odonto';
  if (/advoca|advogad|lawyer|jurid|direito|oab|leis/.test(text)) return 'advocacia';
  if (/arquit|architect|engenha|reforma|interiores|projeto/.test(text)) return 'arquiteto';

  return 'arquiteto';
}

export const DEMO_LEADS: any[] = [];

// Mantém compatibilidade com código antigo
export const BUSINESS_TYPES = NICHE_TYPES.map(n => ({ value: n.value, label: n.label }));
