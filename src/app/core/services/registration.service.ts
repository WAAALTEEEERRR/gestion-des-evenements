import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Registration, RegistrationStatus } from '../models/registration.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrls.registrationService + '/registrations';

  register(registration: { userId: number; eventId: number; notes?: string }): Observable<Registration> {
    return this.http.post<Registration>(`${this.apiUrl}`, registration);
  }

  unregister(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getRegistrationById(id: number): Observable<Registration> {
    return this.http.get<Registration>(`${this.apiUrl}/${id}`);
  }

  getAllRegistrations(): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}`);
  }

  getUserRegistrations(userId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUserUpcomingEvents(userId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/user/${userId}/upcoming`);
  }

  getUserPastEvents(userId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/user/${userId}/past`);
  }

  checkRegistration(userId: number, eventId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('eventId', eventId.toString());
    return this.http.get<{ isRegistered: boolean }>(`${this.apiUrl}/check`, { params })
      .pipe(map(response => response.isRegistered));
  }

  getEventParticipants(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/event/${eventId}`);
  }

  getConfirmedParticipants(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/event/${eventId}/confirmed`);
  }

  getParticipantsCount(eventId: number): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/event/${eventId}/count`)
      .pipe(map(response => response.count));
  }

  updateStatus(id: number, status: RegistrationStatus): Observable<Registration> {
    return this.http.put<Registration>(`${this.apiUrl}/${id}/status`, { status });
  }
}