import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root' // Ceci rend le service disponible partout
})
export class StorageService {

  saveUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.id! : null;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  isOrganizer(): boolean {
    return this.getUserRole() === 'ORGANIZER';
  }

  isParticipant(): boolean {
    return this.getUserRole() === 'PARTICIPANT';
  }
}