import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { Event, EventSearchCriteria, EventStatus } from '../../../core/models/event.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-event-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './event-search.component.html'
})
export class EventSearchComponent implements OnInit {
  private eventService = inject(EventService);
  private router = inject(Router);

  // Critères de recherche
  searchCriteria: EventSearchCriteria = {
    keyword: '',
    location: '',
    category: '',
    status: undefined,
    isFree: undefined,
    startDate: '',
    endDate: '',
    maxPrice: undefined,
    onlyAvailable: undefined
  };

  // Résultats
  events: Event[] = [];
  isLoading = false;
  error: string | null = null;
  hasSearched = false;

  // Mode d'affichage
  displayMode: 'card' | 'list' = 'card';

  // Options pour les filtres
  categories: string[] = [
    'Conférence',
    'Concert',
    'Formation',
    'Sport',
    'Atelier',
    'Festival',
    'Exposition',
    'Networking',
    'Autre'
  ];

  statuses = [
    { value: 'PUBLISHED', label: 'Publié' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'CANCELLED', label: 'Annulé' },
    { value: 'COMPLETED', label: 'Terminé' }
  ];

  ngOnInit(): void {
    // Optionnel : charger tous les événements au démarrage
    // this.search();
  }

  /**
   * Lancer la recherche
   */
  search(): void {
    this.isLoading = true;
    this.error = null;
    this.hasSearched = true;

    // Nettoyer les critères vides
    const cleanedCriteria = this.cleanSearchCriteria();

    this.eventService.searchEvents(cleanedCriteria).subscribe({
      next: (events) => {
        this.events = events;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.error = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Nettoyer les critères de recherche (supprimer les valeurs vides)
   */
  cleanSearchCriteria(): EventSearchCriteria {
    const cleaned: EventSearchCriteria = {};

    if (this.searchCriteria.keyword?.trim()) {
      cleaned.keyword = this.searchCriteria.keyword.trim();
    }
    if (this.searchCriteria.location?.trim()) {
      cleaned.location = this.searchCriteria.location.trim();
    }
    if (this.searchCriteria.category) {
      cleaned.category = this.searchCriteria.category;
    }
    if (this.searchCriteria.status) {
      cleaned.status = this.searchCriteria.status as EventStatus;
    }
    if (this.searchCriteria.isFree !== undefined && this.searchCriteria.isFree !== null) {
      cleaned.isFree = this.searchCriteria.isFree;
    }
    if (this.searchCriteria.startDate) {
      cleaned.startDate = this.searchCriteria.startDate;
    }
    if (this.searchCriteria.endDate) {
      cleaned.endDate = this.searchCriteria.endDate;
    }
    if (this.searchCriteria.maxPrice !== undefined && this.searchCriteria.maxPrice !== null) {
      cleaned.maxPrice = this.searchCriteria.maxPrice;
    }
    if (this.searchCriteria.onlyAvailable !== undefined && this.searchCriteria.onlyAvailable !== null) {
      cleaned.onlyAvailable = this.searchCriteria.onlyAvailable;
    }

    return cleaned;
  }

  /**
   * Réinitialiser le formulaire
   */
  reset(): void {
    this.searchCriteria = {
      keyword: '',
      location: '',
      category: '',
      status: undefined,
      isFree: undefined,
      startDate: '',
      endDate: '',
      maxPrice: undefined,
      onlyAvailable: undefined
    };
    this.events = [];
    this.hasSearched = false;
    this.error = null;
  }

  /**
   * Basculer le mode d'affichage
   */
  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'card' ? 'list' : 'card';
  }

  /**
   * Naviguer vers les détails
   */
  viewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }
}