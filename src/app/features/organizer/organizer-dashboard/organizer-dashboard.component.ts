import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventStatus } from '../../../core/models/event.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './organizer-dashboard.component.html'
})
export class OrganizerDashboardComponent implements OnInit {
  private eventService = inject(EventService);
  private registrationService = inject(RegistrationService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données utilisateur
  organizerId: number | null = null;
  organizerName: string = '';

  // Événements
  myEvents: Event[] = [];
  recentEvents: Event[] = [];
  isLoadingEvents = false;

  // Statistiques
  stats = {
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0
  };
  isLoadingStats = false;

  ngOnInit(): void {
    this.organizerId = this.storageService.getUserId();
    const user = this.storageService.getUser();
    
    if (user) {
      this.organizerName = `${user.firstName} ${user.lastName}`;
    }

    if (this.organizerId) {
      this.loadDashboardData();
    }
  }

  /**
   * Charger toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.loadMyEvents();
    this.loadStatistics();
  }

  /**
   * Charger les événements de l'organisateur
   */
  loadMyEvents(): void {
    if (!this.organizerId) return;

    this.isLoadingEvents = true;

    this.eventService.getEventsByOrganizer(this.organizerId).subscribe({
      next: (events) => {
        this.myEvents = events;
        // Prendre les 3 événements les plus récents
        this.recentEvents = events
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 3);
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
  loadStatistics(): void {
    if (!this.organizerId) return;

    this.isLoadingStats = true;

    this.eventService.getEventsByOrganizer(this.organizerId).subscribe({
      next: (events) => {
        this.stats.totalEvents = events.length;
        this.stats.publishedEvents = events.filter(e => e.status === EventStatus.PUBLISHED).length;
        this.stats.draftEvents = events.filter(e => e.status === EventStatus.DRAFT).length;
        
        // Compter les événements à venir (date future)
        const now = new Date();
        this.stats.upcomingEvents = events.filter(e => {
          const eventDate = new Date(e.eventDate);
          return eventDate > now && e.status === EventStatus.PUBLISHED;
        }).length;

        // Calculer le nombre total de participants
        this.stats.totalParticipants = events.reduce((total, event) => {
          return total + (event.currentParticipants || 0);
        }, 0);

        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.isLoadingStats = false;
      }
    });
  }

  /**
   * Naviguer vers la création d'événement
   */
  createNewEvent(): void {
    this.router.navigate(['/organizer/create-event']);
  }

  /**
   * Naviguer vers mes événements
   */
  viewAllEvents(): void {
    this.router.navigate(['/organizer/my-events']);
  }

  /**
   * Modifier un événement
   */
  editEvent(event: Event): void {
    this.router.navigate(['/organizer/edit-event', event.id]);
  }

  /**
   * Voir les participants d'un événement
   */
  viewParticipants(event: Event): void {
    this.router.navigate(['/organizer/participants', event.id]);
  }

  /**
   * Supprimer un événement
   */
  deleteEvent(event: Event): void {
    if (!event.id) return;

    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`);
    
    if (confirmed) {
      this.eventService.deleteEvent(event.id).subscribe({
        next: () => {
          alert('Événement supprimé avec succès !');
          this.loadDashboardData();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de l\'événement.');
        }
      });
    }
  }

  /**
   * Obtenir le message de bienvenue selon l'heure
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