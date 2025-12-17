import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventStatus } from '../../../core/models/event.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './my-events.component.html'
})
export class MyEventsComponent implements OnInit {
  private eventService = inject(EventService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Données
  allEvents: Event[] = [];
  filteredEvents: Event[] = [];
  organizerId: number | null = null;

  // États
  isLoading = false;
  error: string | null = null;

  // Filtres
  selectedFilter: string = 'all'; // all, published, draft, cancelled, completed
  displayMode: 'card' | 'list' = 'card';
  searchTerm: string = '';

  // Statistiques
  stats = {
    all: 0,
    published: 0,
    draft: 0,
    cancelled: 0,
    completed: 0
  };

  ngOnInit(): void {
    this.organizerId = this.storageService.getUserId();

    // Vérifier si un filtre est passé en paramètre
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.selectedFilter = params['filter'];
      }
    });

    if (this.organizerId) {
      this.loadEvents();
    }
  }

  /**
   * Charger les événements de l'organisateur
   */
  loadEvents(): void {
    if (!this.organizerId) return;

    this.isLoading = true;
    this.error = null;

    this.eventService.getEventsByOrganizer(this.organizerId).subscribe({
      next: (events) => {
        this.allEvents = events;
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.error = 'Impossible de charger vos événements. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculer les statistiques
   */
  calculateStats(): void {
    this.stats.all = this.allEvents.length;
    this.stats.published = this.allEvents.filter(e => e.status === EventStatus.PUBLISHED).length;
    this.stats.draft = this.allEvents.filter(e => e.status === EventStatus.DRAFT).length;
    this.stats.cancelled = this.allEvents.filter(e => e.status === EventStatus.CANCELLED).length;
    this.stats.completed = this.allEvents.filter(e => e.status === EventStatus.COMPLETED).length;
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filtered = [...this.allEvents];

    // Filtre par statut
    if (this.selectedFilter !== 'all') {
      const statusMap: { [key: string]: EventStatus } = {
        'published': EventStatus.PUBLISHED,
        'draft': EventStatus.DRAFT,
        'cancelled': EventStatus.CANCELLED,
        'completed': EventStatus.COMPLETED
      };
      const status = statusMap[this.selectedFilter];
      if (status) {
        filtered = filtered.filter(e => e.status === status);
      }
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) || 
        e.description.toLowerCase().includes(term) ||
        e.location.toLowerCase().includes(term)
      );
    }

    this.filteredEvents = filtered;
  }

  /**
   * Changer le filtre
   */
  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  /**
   * Recherche
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Basculer le mode d'affichage
   */
  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'card' ? 'list' : 'card';
  }

  /**
   * Créer un nouvel événement
   */
  createNewEvent(): void {
    this.router.navigate(['/organizer/create-event']);
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

    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?\n\nCette action est irréversible et supprimera également toutes les inscriptions associées.`);
    
    if (confirmed) {
      this.eventService.deleteEvent(event.id).subscribe({
        next: () => {
          alert('Événement supprimé avec succès !');
          this.loadEvents();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de l\'événement.');
        }
      });
    }
  }

  /**
   * Publier un événement (si brouillon)
   */
  publishEvent(event: Event): void {
    if (!event.id) return;

    const confirmed = confirm(`Publier l'événement "${event.title}" ?\n\nLes participants pourront s'inscrire une fois publié.`);
    
    if (confirmed) {
      this.eventService.publishEvent(event.id).subscribe({
        next: () => {
          alert('Événement publié avec succès !');
          this.loadEvents();
        },
        error: (error) => {
          console.error('Erreur lors de la publication:', error);
          alert('Erreur lors de la publication de l\'événement.');
        }
      });
    }
  }

  /**
   * Annuler un événement
   */
  cancelEvent(event: Event): void {
    if (!event.id) return;

    const confirmed = confirm(`Annuler l'événement "${event.title}" ?\n\nTous les participants seront notifiés.`);
    
    if (confirmed) {
      this.eventService.cancelEvent(event.id).subscribe({
        next: () => {
          alert('Événement annulé avec succès !');
          this.loadEvents();
        },
        error: (error) => {
          console.error('Erreur lors de l\'annulation:', error);
          alert('Erreur lors de l\'annulation de l\'événement.');
        }
      });
    }
  }

  /**
   * Recharger les événements
   */
  reload(): void {
    this.loadEvents();
  }
}