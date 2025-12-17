import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private eventService = inject(EventService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // États du composant
  upcomingEvents: Event[] = [];
  isLoading = false;
  errorMessage = '';

  // Statistiques (pour l'instant statiques, on les calculera plus tard)
  stats = {
    totalEvents: 0,
    totalParticipants: 0,
    totalOrganizers: 0,
    totalCategories: 8
  };

  // Fonctionnalités d'EventHub
  features = [
    {
      icon: '📅',
      title: 'Événements variés',
      description: 'Découvrez des événements pour tous les goûts : conférences, concerts, formations, et plus encore.'
    },
    {
      icon: '🎯',
      title: 'Inscription facile',
      description: 'Inscrivez-vous à vos événements préférés en quelques clics et recevez des confirmations instantanées.'
    },
    {
      icon: '🔔',
      title: 'Notifications en temps réel',
      description: 'Restez informé des modifications, rappels et nouvelles concernant vos événements.'
    },
    {
      icon: '👔',
      title: 'Organisez vos événements',
      description: 'Créez et gérez facilement vos propres événements avec des outils puissants.'
    }
  ];

  ngOnInit(): void {
    this.loadUpcomingEvents();
  }

  /**
   * Charger les événements à venir (limité à 4)
   */
  loadUpcomingEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getAvailableEvents().subscribe({
      next: (events) => {
        // Prendre uniquement les 4 premiers événements
        this.upcomingEvents = events.slice(0, 4);
        
        // Calculer les statistiques à partir des événements
        this.stats.totalEvents = events.length;
        
        console.log('✅ Événements chargés :', this.upcomingEvents);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement événements :', error);
        this.errorMessage = 'Impossible de charger les événements';
        this.isLoading = false;
      }
    });
  }

  /**
   * Naviguer vers les détails d'un événement
   */
  goToEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Naviguer vers tous les événements
   */
  goToAllEvents(): void {
    this.router.navigate(['/events']);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  /**
   * Formater la date en français
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir le badge de disponibilité
   */
  getAvailabilityBadge(event: Event): string {
    if (!event.isAvailable) {
      return 'Complet';
    }
    if (event.availableSeats && event.availableSeats < 10) {
      return `${event.availableSeats} places`;
    }
    return 'Places disponibles';
  }

  /**
   * Obtenir la classe CSS du badge
   */
  getBadgeClass(event: Event): string {
    if (!event.isAvailable) {
      return 'bg-red-100 text-red-800';
    }
    if (event.availableSeats && event.availableSeats < 10) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-green-100 text-green-800';
  }
}