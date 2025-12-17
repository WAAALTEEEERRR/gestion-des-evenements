//Tous les types de notifications du backend
export enum NotificationType {
  REGISTRATION_CONFIRMATION = 'REGISTRATION_CONFIRMATION',
  REGISTRATION_CANCELLED = 'REGISTRATION_CANCELLED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  EVENT_REMINDER = 'EVENT_REMINDER',
  EVENT_STARTING_SOON = 'EVENT_STARTING_SOON',
  EVENT_COMPLETED = 'EVENT_COMPLETED',
  NEW_EVENT_PUBLISHED = 'NEW_EVENT_PUBLISHED',
  REGISTRATION_STATUS_CHANGED = 'REGISTRATION_STATUS_CHANGED',
  GENERAL = 'GENERAL'
}

//Statuts du backend
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED'
}

//Interface complète
export interface Notification {
  id?: number;
  userId: number;
  userEmail?: string;
  userName?: string;
  eventId?: number;
  eventTitle?: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt?: string;
  sentAt?: string;
  readAt?: string;
  priority?: string; // HIGH, MEDIUM, LOW
  actionUrl?: string;
  metadata?: string;
  
  // Champs calculés
  isRead?: boolean;
  isNew?: boolean;
}