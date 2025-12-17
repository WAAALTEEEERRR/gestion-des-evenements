import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventStatus } from '../../../core/models/event.model';
import { Registration } from '../../../core/models/registration.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface MonthlyStats {
  month: string;
  count: number;
  percentage: number;
}

interface EventPopularity {
  event: Event;
  participantsCount: number;
  fillRate: number;
}

@Component({
  selector: 'app-event-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './event-statistics.component.html'
})
export class EventStatisticsComponent implements OnInit {
  private eventService = inject(EventService);
  private registrationService = inject(RegistrationService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données
  organizerId: number | null = null;
  myEvents: Event[] = [];
  allRegistrations: Registration[] = [];

  // Statistiques
  totalEvents = 0;
  publishedEvents = 0;
  cancelledEvents = 0;
  completedEvents = 0;
  totalParticipants = 0;
  averageFillRate = 0;
  totalCapacity = 0;

  // Graphiques
  monthlyStats: MonthlyStats[] = [];
  topEvents: EventPopularity[] = [];
  eventsWithParticipants: { event: Event; count: number; percentage: number }[] = [];

  // UI States
  isLoading = false;

  ngOnInit(): void {
    this.organizerId = this.storageService.getUserId();

    if (!this.organizerId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStatistics();
  }

  /**
   * Charger toutes les données et calculer les statistiques
   */
  loadStatistics(): void {
    if (!this.organizerId) return;

    this.isLoading = true;

    // Charger les événements de l'organisateur
    this.eventService.getEventsByOrganizer(this.organizerId).subscribe({
      next: (events) => {
        this.myEvents = events;
        this.calculateGeneralStats();
        this.calculateMonthlyStats();
        
        // Charger toutes les inscriptions
        this.loadRegistrations();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger toutes les inscriptions pour calculer les statistiques
   */
  loadRegistrations(): void {
    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations) => {
        // Filtrer uniquement les inscriptions pour les événements de cet organisateur
        const eventIds = this.myEvents.map(e => e.id);
        this.allRegistrations = registrations.filter(r => eventIds.includes(r.eventId));

        this.calculateParticipantStats();
        this.calculateTopEvents();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inscriptions:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculer les statistiques générales
   */
  calculateGeneralStats(): void {
    this.totalEvents = this.myEvents.length;
    this.publishedEvents = this.myEvents.filter(e => e.status === EventStatus.PUBLISHED).length;
    this.cancelledEvents = this.myEvents.filter(e => e.status === EventStatus.CANCELLED).length;
    this.completedEvents = this.myEvents.filter(e => e.status === EventStatus.COMPLETED).length;
    
    this.totalCapacity = this.myEvents.reduce((sum, e) => sum + e.capacity, 0);
    this.totalParticipants = this.myEvents.reduce((sum, e) => sum + (e.currentParticipants || 0), 0);
    
    // Calculer le taux de remplissage moyen
    if (this.totalCapacity > 0) {
      this.averageFillRate = Math.round((this.totalParticipants / this.totalCapacity) * 100);
    }
  }

  /**
   * Calculer les statistiques par mois
   */
  calculateMonthlyStats(): void {
    const monthCounts: { [key: string]: number } = {};
    
    this.myEvents.forEach(event => {
      const date = new Date(event.eventDate);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Trouver le maximum pour calculer les pourcentages
    const maxCount = Math.max(...Object.values(monthCounts), 1);

    // Convertir en tableau et trier par date
    this.monthlyStats = Object.entries(monthCounts)
      .map(([month, count]) => ({
        month,
        count,
        percentage: Math.round((count / maxCount) * 100)
      }))
      .slice(0, 6); // Limiter aux 6 derniers mois
  }

  /**
   * Calculer les statistiques de participants par événement
   */
  calculateParticipantStats(): void {
    const eventStats = this.myEvents
      .filter(e => e.status === EventStatus.PUBLISHED || e.status === EventStatus.COMPLETED)
      .map(event => {
        const count = event.currentParticipants || 0;
        const maxCount = Math.max(...this.myEvents.map(e => e.currentParticipants || 0), 1);
        return {
          event,
          count,
          percentage: Math.round((count / maxCount) * 100)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    this.eventsWithParticipants = eventStats;
  }

  /**
   * Calculer le top 5 des événements les plus populaires
   */
  calculateTopEvents(): void {
    const popularity: EventPopularity[] = this.myEvents
      .filter(e => e.status !== EventStatus.CANCELLED)
      .map(event => {
        const participantsCount = event.currentParticipants || 0;
        const fillRate = event.capacity > 0 
          ? Math.round((participantsCount / event.capacity) * 100)
          : 0;
        
        return { event, participantsCount, fillRate };
      })
      .sort((a, b) => b.participantsCount - a.participantsCount)
      .slice(0, 5);

    this.topEvents = popularity;
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      case EventStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case EventStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case EventStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'Publié';
      case EventStatus.DRAFT:
        return 'Brouillon';
      case EventStatus.CANCELLED:
        return 'Annulé';
      case EventStatus.COMPLETED:
        return 'Terminé';
      default:
        return status;
    }
  }

  /**
   * Obtenir la classe CSS pour la barre de progression
   */
  getFillRateClass(fillRate: number): string {
    if (fillRate >= 80) {
      return 'bg-green-500';
    } else if (fillRate >= 50) {
      return 'bg-yellow-500';
    } else {
      return 'bg-blue-500';
    }
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
}