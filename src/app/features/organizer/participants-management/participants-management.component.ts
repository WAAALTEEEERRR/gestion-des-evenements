import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event } from '../../../core/models/event.model';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-participants-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './participants-management.component.html'
})
export class ParticipantsManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private registrationService = inject(RegistrationService);
  private storageService = inject(StorageService);

  // Données
  event: Event | null = null;
  eventId: number | null = null;
  organizerId: number | null = null;

  allRegistrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];

  // États
  isLoadingEvent = false;
  isLoadingRegistrations = false;
  error: string | null = null;

  // Filtres
  selectedFilter: string = 'all'; // all, confirmed, pending, cancelled
  searchTerm: string = '';

  // Statistiques
  stats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    attended: 0,
    noShow: 0
  };

  ngOnInit(): void {
    this.organizerId = this.storageService.getUserId();
    const eventId = this.route.snapshot.paramMap.get('id');

    if (eventId) {
      this.eventId = +eventId;
      this.loadEvent();
      this.loadRegistrations();
    } else {
      this.error = 'ID d\'événement invalide';
    }
  }

  /**
   * Charger l'événement
   */
  loadEvent(): void {
    if (!this.eventId) return;

    this.isLoadingEvent = true;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        // Vérifier que l'utilisateur est bien le propriétaire
        if (event.organizerId !== this.organizerId) {
          this.error = 'Vous n\'êtes pas autorisé à voir les participants de cet événement.';
          this.isLoadingEvent = false;
          return;
        }

        this.event = event;
        this.isLoadingEvent = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'événement:', error);
        this.error = 'Impossible de charger l\'événement.';
        this.isLoadingEvent = false;
      }
    });
  }

  /**
   * Charger les inscriptions
   */
  loadRegistrations(): void {
    if (!this.eventId) return;

    this.isLoadingRegistrations = true;

    this.registrationService.getEventParticipants(this.eventId).subscribe({
      next: (registrations) => {
        this.allRegistrations = registrations;
        this.calculateStats();
        this.applyFilters();
        this.isLoadingRegistrations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inscriptions:', error);
        this.error = 'Impossible de charger les participants.';
        this.isLoadingRegistrations = false;
      }
    });
  }

  /**
   * Calculer les statistiques
   */
  calculateStats(): void {
    this.stats.total = this.allRegistrations.length;
    this.stats.confirmed = this.allRegistrations.filter(r => r.status === RegistrationStatus.CONFIRMED).length;
    this.stats.pending = this.allRegistrations.filter(r => r.status === RegistrationStatus.PENDING).length;
    this.stats.cancelled = this.allRegistrations.filter(r => r.status === RegistrationStatus.CANCELLED).length;
    this.stats.attended = this.allRegistrations.filter(r => r.status === RegistrationStatus.ATTENDED).length;
    this.stats.noShow = this.allRegistrations.filter(r => r.status === RegistrationStatus.NO_SHOW).length;
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filtered = [...this.allRegistrations];

    // Filtre par statut
    if (this.selectedFilter !== 'all') {
      const statusMap: { [key: string]: RegistrationStatus } = {
        'confirmed': RegistrationStatus.CONFIRMED,
        'pending': RegistrationStatus.PENDING,
        'cancelled': RegistrationStatus.CANCELLED,
        'attended': RegistrationStatus.ATTENDED,
        'noShow': RegistrationStatus.NO_SHOW
      };
      const status = statusMap[this.selectedFilter];
      if (status) {
        filtered = filtered.filter(r => r.status === status);
      }
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName?.toLowerCase().includes(term) || 
        r.userEmail?.toLowerCase().includes(term)
      );
    }

    this.filteredRegistrations = filtered;
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
   * Changer le statut d'une inscription
   */
  changeStatus(registration: Registration, newStatus: RegistrationStatus): void {
    if (!registration.id) return;

    this.registrationService.updateStatus(registration.id, newStatus).subscribe({
      next: (updatedRegistration) => {
        // Mettre à jour localement
        const index = this.allRegistrations.findIndex(r => r.id === registration.id);
        if (index !== -1) {
          this.allRegistrations[index] = updatedRegistration;
        }
        this.calculateStats();
        this.applyFilters();
        alert('Statut mis à jour avec succès !');
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut.');
      }
    });
  }

  /**
   * Obtenir le label du statut en français
   */
  getStatusLabel(status: RegistrationStatus): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'CANCELLED': 'Annulé',
      'ATTENDED': 'Présent',
      'NO_SHOW': 'Absent'
    };
    return labels[status] || status;
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(status: RegistrationStatus): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'ATTENDED': 'bg-blue-100 text-blue-800',
      'NO_SHOW': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Formater la date
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Exporter la liste (simple alert pour l'instant)
   */
  exportList(): void {
    alert('Fonctionnalité d\'export à venir !\n\n' + 
          `${this.filteredRegistrations.length} participants seraient exportés.`);
    // TODO: Implémenter l'export CSV/Excel
  }

  /**
   * Retour
   */
  goBack(): void {
    this.router.navigate(['/organizer/my-events']);
  }
}