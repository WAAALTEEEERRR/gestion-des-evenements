import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../../core/services/registration.service';
import { EventService } from '../../../core/services/event.service';
import { StorageService } from '../../../core/services/storage.service';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';
import { Event } from '../../../core/models/event.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type FilterTab = 'all' | 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './my-registrations.component.html'
})
export class MyRegistrationsComponent implements OnInit {
  private registrationService = inject(RegistrationService);
  private eventService = inject(EventService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données utilisateur
  userId: number | null = null;

  // Inscriptions et événements
  allRegistrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];
  registrationEvents = new Map<number, Event>(); // Map eventId -> Event
  
  // UI States
  isLoading = false;
  activeTab: FilterTab = 'all';
  
  // Popup de confirmation
  showConfirmDialog = false;
  registrationToCancel: Registration | null = null;
  isCancelling = false;

  // Message de succès
  showSuccessMessage = false;
  successMessage = '';

  // Statistiques
  stats = {
    total: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0
  };

  ngOnInit(): void {
    this.userId = this.storageService.getUserId();
    
    if (this.userId) {
      this.loadRegistrations();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Charger toutes les inscriptions de l'utilisateur
   */
  loadRegistrations(): void {
    if (!this.userId) return;

    this.isLoading = true;

    this.registrationService.getUserRegistrations(this.userId).subscribe({
      next: (registrations) => {
        this.allRegistrations = registrations;
        this.calculateStats();
        this.filterRegistrations();
        this.loadEventDetails();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inscriptions:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les détails des événements
   */
  loadEventDetails(): void {
    const eventIds = [...new Set(this.allRegistrations.map(r => r.eventId))];
    
    eventIds.forEach(eventId => {
      this.eventService.getEventById(eventId).subscribe({
        next: (event) => {
          this.registrationEvents.set(eventId, event);
        },
        error: (error) => {
          console.error(`Erreur lors du chargement de l'événement ${eventId}:`, error);
        }
      });
    });
  }

  /**
   * Calculer les statistiques
   */
  calculateStats(): void {
    const now = new Date();

    this.stats.total = this.allRegistrations.length;
    
    this.stats.upcoming = this.allRegistrations.filter(r => {
      const eventDate = new Date(r.eventDate || '');
      return eventDate > now && r.status !== 'CANCELLED';
    }).length;

    this.stats.past = this.allRegistrations.filter(r => {
      const eventDate = new Date(r.eventDate || '');
      return eventDate <= now && r.status !== 'CANCELLED';
    }).length;

    this.stats.cancelled = this.allRegistrations.filter(r => r.status === 'CANCELLED').length;
  }

  /**
   * Changer d'onglet
   */
  changeTab(tab: FilterTab): void {
    this.activeTab = tab;
    this.filterRegistrations();
  }

  /**
   * Filtrer les inscriptions selon l'onglet actif
   */
  filterRegistrations(): void {
    const now = new Date();

    switch (this.activeTab) {
      case 'all':
        this.filteredRegistrations = [...this.allRegistrations];
        break;

      case 'upcoming':
        this.filteredRegistrations = this.allRegistrations.filter(r => {
          const eventDate = new Date(r.eventDate || '');
          return eventDate > now && r.status !== 'CANCELLED';
        });
        break;

      case 'past':
        this.filteredRegistrations = this.allRegistrations.filter(r => {
          const eventDate = new Date(r.eventDate || '');
          return eventDate <= now && r.status !== 'CANCELLED';
        });
        break;

      case 'cancelled':
        this.filteredRegistrations = this.allRegistrations.filter(r => r.status === 'CANCELLED');
        break;
    }

    // Trier par date (les plus proches en premier pour upcoming, les plus récents pour past)
    this.filteredRegistrations.sort((a, b) => {
      const dateA = new Date(a.eventDate || '').getTime();
      const dateB = new Date(b.eventDate || '').getTime();
      
      if (this.activeTab === 'past') {
        return dateB - dateA; // Plus récent en premier pour les événements passés
      } else {
        return dateA - dateB; // Plus proche en premier pour les événements à venir
      }
    });
  }

  /**
   * Obtenir l'événement correspondant à une inscription
   */
  getEvent(eventId: number): Event | undefined {
    return this.registrationEvents.get(eventId);
  }

  /**
   * Ouvrir la popup de confirmation de désinscription
   */
  openCancelDialog(registration: Registration): void {
    this.registrationToCancel = registration;
    this.showConfirmDialog = true;
  }

  /**
   * Fermer la popup de confirmation
   */
  closeCancelDialog(): void {
    this.showConfirmDialog = false;
    this.registrationToCancel = null;
  }

  /**
   * Confirmer la désinscription
   */
  confirmUnregister(): void {
    if (!this.registrationToCancel || !this.registrationToCancel.id) return;

    this.isCancelling = true;

    this.registrationService.unregister(this.registrationToCancel.id).subscribe({
      next: () => {
        this.isCancelling = false;
        this.closeCancelDialog();
        
        // Afficher le message de succès
        this.successMessage = `Vous vous êtes désinscrit de "${this.registrationToCancel?.eventTitle}" avec succès.`;
        this.showSuccessMessage = true;
        
        // Cacher le message après 5 secondes
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);

        // Recharger la liste
        this.loadRegistrations();
      },
      error: (error) => {
        console.error('Erreur lors de la désinscription:', error);
        this.isCancelling = false;
        alert('Une erreur est survenue lors de la désinscription. Veuillez réessayer.');
      }
    });
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
   * Obtenir la classe CSS du badge de statut
   */
  getStatusBadgeClass(status?: RegistrationStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ATTENDED':
        return 'bg-blue-100 text-blue-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status?: RegistrationStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmé';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulé';
      case 'ATTENDED':
        return 'Présent';
      case 'NO_SHOW':
        return 'Absent';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Vérifier si l'inscription peut être annulée
   */
  canUnregister(registration: Registration): boolean {
    // On peut se désinscrire si :
    // 1. Le statut n'est pas déjà CANCELLED
    // 2. L'événement n'est pas encore passé
    if (registration.status === 'CANCELLED') {
      return false;
    }

    const eventDate = new Date(registration.eventDate || '');
    const now = new Date();
    
    return eventDate > now;
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
   * Fermer le message de succès
   */
  closeSuccessMessage(): void {
    this.showSuccessMessage = false;
  }
}