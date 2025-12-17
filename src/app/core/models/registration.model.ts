//Tous les statuts du backend
export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW'
}

//Interface complète correspondant au backend
export interface Registration {
  id?: number;
  userId: number;
  userEmail?: string;
  userName?: string;
  eventId: number;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  status: RegistrationStatus;
  registeredAt?: string;
  updatedAt?: string;
  notes?: string;
}

//Request pour créer une inscription
export interface RegistrationRequest {
  userId: number;
  eventId: number;
  notes?: string;
}