export interface Lead {
  id?: number;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  placeId: string;
  photoUrl: string | null;
  category: string | null;
  status: 'novo' | 'contatado' | 'respondeu' | 'convertido' | 'ignorado';
  createdAt?: string;
}

export interface Campaign {
  id?: number;
  name: string;
  templateName: string;
  message: string;
  totalLeads: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  status: 'rascunho' | 'enviando' | 'concluida' | 'pausada';
  createdAt?: string;
}

export interface Message {
  id?: number;
  campaignId: number;
  leadId: number;
  waMessageId: string | null;
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'falhou';
  error: string | null;
  sentAt?: string;
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: string;
  keyword?: string;
}

export interface SearchFilters {
  minReviews: number;
  minRating: number;
  noWebsite: boolean;
  hasPhone: boolean;
}

export interface Settings {
  googleMapsApiKey: string;
  whatsappToken: string;
  whatsappPhoneNumberId: string;
  whatsappWabaId: string;
  defaultMessage: string;
}
