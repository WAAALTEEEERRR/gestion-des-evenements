import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment'; // Chemin corrigé
import { User, LoginRequest, LoginResponse } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private router = inject(Router);
  
  private apiUrl = environment.apiUrls.userService + '/users';

  register(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        const user: User = {
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          role: response.role
        };
        this.storageService.saveUser(user);
      })
    );
  }

  logout(): void {
    this.storageService.logout();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  getCurrentUser(): User | null {
    return this.storageService.getUser();
  }
}