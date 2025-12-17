import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event } from '../../../core/models/event.model';
import { Registration } from '../../../core/models/registration.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-participant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './participant-dashboard.component.html'
})
export class ParticipantDashboardComponent implements OnInit {
  private eventService = inject(EventService);
  private registrationService = inject(RegistrationService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données utilisateur
  participantId: number | null = null;
  participantName: string = '';

  // Inscriptions
  myRegistrations: Registration[] = [];
  upcomingEvents: Registration[] = [];
  isLoadingRegistrations = false;

  // Événements disponibles (suggestions)
  availableEvents: Event[] = [];
  isLoadingEvents = false;

  // Statistiques
  stats = {
    totalRegistrations: 0,
    upcomingEvents: 0,
    pastEvents: 0
  };

  ngOnInit(): void {
    this.participantId = this.storageService.getUserId();
    const user = this.storageService.getUser();
    
    if (user) {
      this.participantName = `${user.firstName} ${user.lastName}`;
    }

    if (this.participantId) {
      this.loadDashboardData();
    }
  }

  /**
   * Charger toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.loadMyRegistrations();
    this.loadAvailableEvents();
  }

  /**
   * Charger mes inscriptions
   */
  loadMyRegistrations(): void {
    if (!this.participantId) return;

    this.isLoadingRegistrations = true;

    this.registrationService.getUserRegistrations(this.participantId).subscribe({
      next: (registrations) => {
        this.myRegistrations = registrations;
        
        // Filtrer les événements à venir
        const now = new Date();
        this.upcomingEvents = registrations
          .filter(r => {
            const eventDate = new Date(r.eventDate || '');
            return eventDate > now && r.status !== 'CANCELLED';
          })
          .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
          .slice(0, 3); // Les 3 prochains

        this.calculateStats();
        this.isLoadingRegistrations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inscriptions:', error);
        this.isLoadingRegistrations = false;
      }
    });
  }

  /**
   * Charger les événements disponibles (suggestions)
   */
  loadAvailableEvents(): void {
    this.isLoadingEvents = true;

    this.eventService.getAvailableEvents().subscribe({
      next: (events) => {
        // Prendre 4 événements aléatoires
        this.availableEvents = events
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);
        this.isLoadingEvents = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.isLoadingEvents = false;
      }
    });
  }

  /**
   * Calculer les statistiques
   */
  calculateStats(): void {
    this.stats.totalRegistrations = this.myRegistrations.length;
    
    const now = new Date();
    this.stats.upcomingEvents = this.myRegistrations.filter(r => {
      const eventDate = new Date(r.eventDate || '');
      return eventDate > now && r.status !== 'CANCELLED';
    }).length;

    this.stats.pastEvents = this.myRegistrations.filter(r => {
      const eventDate = new Date(r.eventDate || '');
      return eventDate <= now;
    }).length;
  }

  /**
   * Naviguer vers mes inscriptions
   */
  viewMyRegistrations(): void {
    this.router.navigate(['/participant/my-registrations']);
  }

  /**
   * Naviguer vers la liste des événements
   */
  exploreEvents(): void {
    this.router.navigate(['/events']);
  }

  /**
   * Naviguer vers les détails d'un événement
   */
  viewEventDetails(eventId?: number): void {
    if (eventId) {
      this.router.navigate(['/events', eventId]);
    }
  }

  /**
   * Formater la date
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'Date non spécifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir le message de bienvenue
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Bonjour';
    } else if (hour < 18) {
      return 'Bon après-midi';
    } else {
      return 'Bonsoir';
    }
  }
}