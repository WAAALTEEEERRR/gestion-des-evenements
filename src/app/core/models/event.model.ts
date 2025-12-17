export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT'
}

// ✅ Interface complète correspondant au backend
export interface Event {
  id?: number;
  title: string;
  description: string;
  location: string;
  eventDate: string; // Format ISO 8601
  endDate?: string;
  capacity: number; // Nombre maximum de participants
  currentParticipants?: number;
  status: EventStatus;
  organizerId: number;
  organizerName?: string;
  category: string;
  isFree?: boolean;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Champs calculés par le backend
  isAvailable?: boolean;
  availableSeats?: number;
  files?: EventFile[];
}

// ✅ Interface pour les fichiers d'événement
export interface EventFile {
  id?: number;
  fileName: string;
  filePath?: string;
  fileType: FileType;
  contentType?: string;
  fileSize?: number;
  description?: string;
  eventId?: number;
  uploadedAt?: string;
  downloadUrl?: string; // URL générée par le backend
}

// ✅ Critères de recherche (pour le formulaire de recherche)
export interface EventSearchCriteria {
  keyword?: string;
  location?: string;
  category?: string;
  status?: EventStatus;
  organizerId?: number;
  isFree?: boolean;
  startDate?: string;
  endDate?: string;
  maxPrice?: number;
  onlyAvailable?: boolean;
}