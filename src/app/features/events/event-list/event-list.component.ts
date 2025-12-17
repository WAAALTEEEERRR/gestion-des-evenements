import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EventCardComponent, LoadingSpinnerComponent],
  templateUrl: './event-list.component.html'
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private router = inject(Router);

  // États
  events: Event[] = [];
  filteredEvents: Event[] = [];
  isLoading = false;
  error: string | null = null;

  // Filtres
  selectedCategory: string = 'all';
  selectedFilter: string = 'all'; // all, available, free
  displayMode: 'card' | 'list' = 'card';

  // Catégories disponibles
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

  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Charger tous les événements disponibles
   */
  loadEvents(): void {
    this.isLoading = true;
    this.error = null;

    this.eventService.getAvailableEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.error = 'Impossible de charger les événements. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Appliquer les filtres sur les événements
   */
  applyFilters(): void {
    let filtered = [...this.events];

    // Filtre par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    // Filtre par disponibilité/prix
    if (this.selectedFilter === 'available') {
      filtered = filtered.filter(event => event.isAvailable);
    } else if (this.selectedFilter === 'free') {
      filtered = filtered.filter(event => event.isFree);
    }

    this.filteredEvents = filtered;
  }

  /**
   * Changer la catégorie sélectionnée
   */
  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Changer le filtre sélectionné
   */
  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  /**
   * Basculer le mode d'affichage (card/list)
   */
  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'card' ? 'list' : 'card';
  }

  /**
   * Naviguer vers les détails d'un événement
   */
  viewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Recharger les événements
   */
  reload(): void {
    this.loadEvents();
  }
}