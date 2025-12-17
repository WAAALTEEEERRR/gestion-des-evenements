import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Event, EventFile, EventStatus, FileType, EventSearchCriteria } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrls.eventService + '/events';

  // ==========================================
  // CRUD DE BASE
  // ==========================================

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}`, event);
  }

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}`);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // RECHERCHE ET FILTRAGE
  // ==========================================

  searchEvents(criteria: EventSearchCriteria): Observable<Event[]> {
    let params = new HttpParams();
    
    if (criteria.keyword) params = params.set('keyword', criteria.keyword);
    if (criteria.location) params = params.set('location', criteria.location);
    if (criteria.category) params = params.set('category', criteria.category);
    if (criteria.status) params = params.set('status', criteria.status);
    if (criteria.organizerId) params = params.set('organizerId', criteria.organizerId.toString());
    if (criteria.isFree !== undefined) params = params.set('isFree', criteria.isFree.toString());
    if (criteria.startDate) params = params.set('startDate', criteria.startDate);
    if (criteria.endDate) params = params.set('endDate', criteria.endDate);
    if (criteria.maxPrice) params = params.set('maxPrice', criteria.maxPrice.toString());
    if (criteria.onlyAvailable) params = params.set('onlyAvailable', criteria.onlyAvailable.toString());

    return this.http.get<Event[]>(`${this.apiUrl}/search`, { params });
  }

  getEventsByOrganizer(organizerId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/organizer/${organizerId}`);
  }

  getEventsByStatus(status: EventStatus): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/status/${status}`);
  }

  getEventsByCategory(category: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/category/${category}`);
  }

  getAvailableEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/available`);
  }

  // ==========================================
  // GESTION DU STATUT
  // ==========================================

  publishEvent(id: number): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/${id}/publish`, {});
  }

  cancelEvent(id: number): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/${id}/cancel`, {});
  }

  completeEvent(id: number): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/${id}/complete`, {});
  }

  // ==========================================
  // GESTION DES FICHIERS
  // ==========================================

  uploadFile(eventId: number, file: File, fileType: FileType, description?: string): Observable<EventFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<EventFile>(`${this.apiUrl}/${eventId}/upload`, formData);
  }

  uploadMultipleFiles(eventId: number, files: File[], fileType: FileType): Observable<EventFile[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('fileType', fileType);
    return this.http.post<EventFile[]>(`${this.apiUrl}/${eventId}/upload-multiple`, formData);
  }

  getEventFiles(eventId: number): Observable<EventFile[]> {
    return this.http.get<EventFile[]>(`${this.apiUrl}/${eventId}/files`);
  }

  getEventFilesByType(eventId: number, fileType: FileType): Observable<EventFile[]> {
    return this.http.get<EventFile[]>(`${this.apiUrl}/${eventId}/files/type/${fileType}`);
  }

  downloadFile(eventId: number, fileId: number): string {
    return `${this.apiUrl}/${eventId}/files/${fileId}`;
  }

  deleteFile(eventId: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}/files/${fileId}`);
  }
}