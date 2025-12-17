import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventFile, FileType } from '../../../core/models/event.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './event-details.component.html'
})
export class EventDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private registrationService = inject(RegistrationService);
  private storageService = inject(StorageService);

  // États
  event: Event | null = null;
  isLoading = false;
  error: string | null = null;
  
  // Fichiers
  eventFiles: EventFile[] = [];
  images: EventFile[] = [];
  videos: EventFile[] = [];
  documents: EventFile[] = [];
  isLoadingFiles = false;
  
  // Inscription
  isRegistering = false;
  isRegistered = false;
  registrationError: string | null = null;
  registrationSuccess = false;

  // Utilisateur
  currentUserId: number | null = null;
  isLoggedIn = false;

  ngOnInit(): void {
    this.currentUserId = this.storageService.getUserId();
    this.isLoggedIn = this.storageService.isLoggedIn();

    // Récupérer l'ID de l'événement depuis l'URL
    const eventId = this.route.snapshot.paramMap.get('id');
    
    if (eventId) {
      this.loadEventDetails(+eventId);
      this.loadEventFiles(+eventId);
      
      // Vérifier si l'utilisateur est déjà inscrit
      if (this.isLoggedIn && this.currentUserId) {
        this.checkRegistrationStatus(+eventId);
      }
    } else {
      this.error = 'ID d\'événement invalide';
    }
  }

  /**
   * Charger les détails de l'événement
   */
  loadEventDetails(eventId: number): void {
    this.isLoading = true;
    this.error = null;

    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'événement:', error);
        this.error = 'Événement introuvable ou erreur de chargement';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les fichiers de l'événement
   */
  loadEventFiles(eventId: number): void {
    this.isLoadingFiles = true;

    this.eventService.getEventFiles(eventId).subscribe({
      next: (files) => {
        this.eventFiles = files;
        this.images = files.filter(f => f.fileType === FileType.IMAGE);
        this.videos = files.filter(f => f.fileType === FileType.VIDEO);
        this.documents = files.filter(f => f.fileType === FileType.DOCUMENT);
        this.isLoadingFiles = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
        this.isLoadingFiles = false;
      }
    });
  }

  /**
   * Vérifier si l'utilisateur est déjà inscrit
   */
  checkRegistrationStatus(eventId: number): void {
    if (!this.currentUserId) return;

    this.registrationService.checkRegistration(this.currentUserId, eventId).subscribe({
      next: (isRegistered) => {
        this.isRegistered = isRegistered;
      },
      error: (error) => {
        console.error('Erreur lors de la vérification de l\'inscription:', error);
      }
    });
  }

  /**
   * S'inscrire à l'événement
   */
  registerToEvent(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/events/${this.event?.id}` }
      });
      return;
    }

    if (!this.currentUserId || !this.event?.id) {
      return;
    }

    this.isRegistering = true;
    this.registrationError = null;
    this.registrationSuccess = false;

    const registrationData = {
      userId: this.currentUserId,
      eventId: this.event.id
    };

    this.registrationService.register(registrationData).subscribe({
      next: (registration) => {
        this.isRegistering = false;
        this.isRegistered = true;
        this.registrationSuccess = true;
        
        // Recharger les détails de l'événement pour mettre à jour le nombre de participants
        if (this.event?.id) {
          this.loadEventDetails(this.event.id);
        }

        // Masquer le message de succès après 5 secondes
        setTimeout(() => {
          this.registrationSuccess = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Erreur lors de l\'inscription:', error);
        this.isRegistering = false;
        
        if (error.status === 400) {
          this.registrationError = 'Vous êtes déjà inscrit à cet événement ou il n\'y a plus de places disponibles.';
        } else {
          this.registrationError = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
        }

        // Masquer le message d'erreur après 5 secondes
        setTimeout(() => {
          this.registrationError = null;
        }, 5000);
      }
    });
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(file: EventFile): void {
    if (!this.event?.id || !file.id) return;
    
    const url = this.eventService.downloadFile(this.event.id, file.id);
    window.open(url, '_blank');
  }

  /**
   * Obtenir l'URL de téléchargement
   */
  getDownloadUrl(file: EventFile): string {
    if (!this.event?.id || !file.id) return '';
    return this.eventService.downloadFile(this.event.id, file.id);
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Formater la date en français
   */
  formatDate(dateString: string): string {
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
   * Formater la date courte
   */
  formatDateShort(dateString: string): string {
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
   * Obtenir l'icône de la catégorie
   */
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Conférence': '🎤',
      'Concert': '🎵',
      'Formation': '📚',
      'Sport': '⚽',
      'Atelier': '🎨',
      'Festival': '🎪',
      'Exposition': '🖼️',
      'Networking': '🤝',
      'Autre': '🎉'
    };
    return icons[category] || '📅';
  }

  /**
   * Obtenir le pourcentage de places restantes
   */
  getAvailabilityPercentage(): number {
    if (!this.event) return 0;
    const available = this.event.availableSeats || 0;
    const total = this.event.capacity;
    return Math.round((available / total) * 100);
  }

  /**
   * Obtenir la classe CSS de la barre de progression
   */
  getProgressBarClass(): string {
    const percentage = this.getAvailabilityPercentage();
    if (percentage > 50) {
      return 'bg-green-500';
    } else if (percentage > 20) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    this.router.navigate(['/events']);
  }
}