import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventStatus, EventFile, FileType } from '../../../core/models/event.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './edit-event.component.html'
})
export class EditEventComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private storageService = inject(StorageService);

  // Données
  event: Event = {
    title: '',
    description: '',
    location: '',
    eventDate: '',
    endDate: '',
    capacity: 50,
    status: EventStatus.DRAFT,
    organizerId: 0,
    category: '',
    isFree: false,
    price: 0
  };

  eventId: number | null = null;
  organizerId: number | null = null;

  // Fichiers existants
  existingFiles: EventFile[] = [];
  images: EventFile[] = [];
  videos: EventFile[] = [];
  documents: EventFile[] = [];

  // Nouveaux fichiers à uploader
  newFiles: {
    images: File[];
    videos: File[];
    documents: File[];
  } = {
    images: [],
    videos: [],
    documents: []
  };

  // États
  isLoading = false;
  isSubmitting = false;
  isUploadingFiles = false;
  isDeletingFile = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Options
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
    this.organizerId = this.storageService.getUserId();
    const eventId = this.route.snapshot.paramMap.get('id');

    if (eventId) {
      this.eventId = +eventId;
      this.loadEvent();
      this.loadEventFiles();
    } else {
      this.error = 'ID d\'événement invalide';
    }
  }

  /**
   * Charger l'événement
   */
  loadEvent(): void {
    if (!this.eventId) return;

    this.isLoading = true;
    this.error = null;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        // Vérifier que l'utilisateur est bien le propriétaire
        if (event.organizerId !== this.organizerId) {
          this.error = 'Vous n\'êtes pas autorisé à modifier cet événement.';
          this.isLoading = false;
          return;
        }

        this.event = event;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.error = 'Impossible de charger l\'événement.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les fichiers existants
   */
  loadEventFiles(): void {
    if (!this.eventId) return;

    this.eventService.getEventFiles(this.eventId).subscribe({
      next: (files) => {
        this.existingFiles = files;
        this.images = files.filter(f => f.fileType === FileType.IMAGE);
        this.videos = files.filter(f => f.fileType === FileType.VIDEO);
        this.documents = files.filter(f => f.fileType === FileType.DOCUMENT);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
      }
    });
  }

  /**
   * Toggle gratuit/payant
   */
  onFreeChange(): void {
    if (this.event.isFree) {
      this.event.price = 0;
    }
  }

  /**
   * Gérer la sélection de nouveaux fichiers
   */
  onImageSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.newFiles.images = files.filter(f => f.type.startsWith('image/'));
  }

  onVideoSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.newFiles.videos = files.filter(f => f.type.startsWith('video/'));
  }

  onDocumentSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.newFiles.documents = files;
  }

  /**
   * Supprimer un nouveau fichier (avant upload)
   */
  removeNewFile(type: 'images' | 'videos' | 'documents', index: number): void {
    this.newFiles[type].splice(index, 1);
  }

  /**
   * Supprimer un fichier existant
   */
  deleteExistingFile(file: EventFile): void {
    if (!this.eventId || !file.id) return;

    const confirmed = confirm(`Supprimer le fichier "${file.fileName}" ?\n\nCette action est irréversible.`);
    
    if (confirmed) {
      this.isDeletingFile = true;

      this.eventService.deleteFile(this.eventId, file.id).subscribe({
        next: () => {
          this.loadEventFiles();
          this.isDeletingFile = false;
          alert('Fichier supprimé avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du fichier.');
          this.isDeletingFile = false;
        }
      });
    }
  }

  /**
   * Mettre à jour l'événement
   */
  updateEvent(): void {
    if (!this.validateForm() || !this.eventId) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;

    // Étape 1: Mettre à jour l'événement
    this.eventService.updateEvent(this.eventId, this.event).subscribe({
      next: (updatedEvent) => {
        // Étape 2: Uploader les nouveaux fichiers si présents
        if (this.hasNewFiles()) {
          this.uploadNewFiles(this.eventId!);
        } else {
          this.showSuccess();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.error = 'Une erreur est survenue lors de la mise à jour.';
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Vérifier s'il y a de nouveaux fichiers
   */
  hasNewFiles(): boolean {
    return this.newFiles.images.length > 0 || 
           this.newFiles.videos.length > 0 || 
           this.newFiles.documents.length > 0;
  }

  /**
   * Uploader les nouveaux fichiers
   */
  uploadNewFiles(eventId: number): void {
    this.isUploadingFiles = true;
    let uploadCount = 0;
    const totalFiles = this.newFiles.images.length + 
                       this.newFiles.videos.length + 
                       this.newFiles.documents.length;

    // Upload images
    if (this.newFiles.images.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.newFiles.images, FileType.IMAGE).subscribe({
        next: () => {
          uploadCount += this.newFiles.images.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload images:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }

    // Upload videos
    if (this.newFiles.videos.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.newFiles.videos, FileType.VIDEO).subscribe({
        next: () => {
          uploadCount += this.newFiles.videos.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload videos:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }

    // Upload documents
    if (this.newFiles.documents.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.newFiles.documents, FileType.DOCUMENT).subscribe({
        next: () => {
          uploadCount += this.newFiles.documents.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload documents:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }
  }

  /**
   * Vérifier si tous les uploads sont terminés
   */
  checkUploadComplete(uploadCount: number, totalFiles: number): void {
    if (uploadCount >= totalFiles) {
      this.isUploadingFiles = false;
      this.loadEventFiles(); // Recharger les fichiers
      this.showSuccess();
    }
  }

  /**
   * Afficher le message de succès
   */
  showSuccess(): void {
    this.successMessage = 'Événement mis à jour avec succès !';
    this.isSubmitting = false;

    // Rediriger après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/organizer/my-events']);
    }, 2000);
  }

  /**
   * Valider le formulaire
   */
  validateForm(): boolean {
    if (!this.event.title?.trim()) {
      this.error = 'Le titre est obligatoire.';
      return false;
    }
    if (!this.event.description?.trim()) {
      this.error = 'La description est obligatoire.';
      return false;
    }
    if (!this.event.location?.trim()) {
      this.error = 'Le lieu est obligatoire.';
      return false;
    }
    if (!this.event.eventDate) {
      this.error = 'La date de début est obligatoire.';
      return false;
    }
    if (!this.event.category) {
      this.error = 'La catégorie est obligatoire.';
      return false;
    }
    if (this.event.capacity <= 0) {
      this.error = 'La capacité doit être supérieure à 0.';
      return false;
    }
    if (!this.event.isFree && (this.event.price === undefined || this.event.price <= 0)) {
      this.error = 'Le prix doit être supérieur à 0 pour un événement payant.';
      return false;
    }

    return true;
  }

  /**
   * Annuler et retourner
   */
  cancel(): void {
    const confirmed = confirm('Êtes-vous sûr de vouloir annuler ? Les modifications ne seront pas enregistrées.');
    if (confirmed) {
      this.router.navigate(['/organizer/my-events']);
    }
  }

  /**
   * Obtenir la taille formatée
   */
  getFileSize(file: File): string {
    const bytes = file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Obtenir la taille formatée (EventFile)
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}