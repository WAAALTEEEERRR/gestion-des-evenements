import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { User } from '../../../core/models/user.model';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // États du composant
  currentUser: User | null = null;
  isLoggedIn = false;
  isOrganizer = false;
  isParticipant = false;
  isMobileMenuOpen = false;

  ngOnInit(): void {
    this.loadUserInfo();
  }

  /**
   * Charger les informations de l'utilisateur connecté
   */
  loadUserInfo(): void {
    this.currentUser = this.storageService.getUser();
    this.isLoggedIn = this.storageService.isLoggedIn();
    this.isOrganizer = this.storageService.isOrganizer();
    this.isParticipant = this.storageService.isParticipant();
  }

  /**
   * Afficher/Masquer le menu mobile
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Fermer le menu mobile
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
    this.loadUserInfo();
    this.closeMobileMenu();
  }

  /**
   * Obtenir le nom d'affichage de l'utilisateur
   */
  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return '';
  }

  /**
   * Obtenir les initiales de l'utilisateur (pour l'avatar)
   */
  getUserInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return '';
  }
}