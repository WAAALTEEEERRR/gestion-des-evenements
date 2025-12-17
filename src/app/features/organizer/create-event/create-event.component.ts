import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { StorageService } from '../../../core/services/storage.service';
import { Event, EventStatus, FileType } from '../../../core/models/event.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './create-event.component.html'
})
export class CreateEventComponent implements OnInit {
  private eventService = inject(EventService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données du formulaire
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

  // Fichiers sélectionnés
  selectedFiles: {
    images: File[];
    videos: File[];
    documents: File[];
  } = {
    images: [],
    videos: [],
    documents: []
  };

  // États
  isSubmitting = false;
  isUploadingFiles = false;
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
    const organizerId = this.storageService.getUserId();
    if (organizerId) {
      this.event.organizerId = organizerId;
    }
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
   * Gérer la sélection de fichiers (images)
   */
  onImageSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.images = files.filter(f => f.type.startsWith('image/'));
  }

  /**
   * Gérer la sélection de fichiers (vidéos)
   */
  onVideoSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.videos = files.filter(f => f.type.startsWith('video/'));
  }

  /**
   * Gérer la sélection de fichiers (documents)
   */
  onDocumentSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.documents = files;
  }

  /**
   * Supprimer un fichier de la liste (avant upload)
   */
  removeFile(type: 'images' | 'videos' | 'documents', index: number): void {
    this.selectedFiles[type].splice(index, 1);
  }

  /**
   * Créer l'événement en tant que BROUILLON
   */
  saveAsDraft(): void {
    this.event.status = EventStatus.DRAFT;
    this.submitEvent();
  }

  /**
   * Créer et PUBLIER l'événement directement
   */
  publishEvent(): void {
    if (!this.validateForm()) {
      return;
    }
    this.event.status = EventStatus.PUBLISHED;
    this.submitEvent();
  }

  /**
   * Soumettre le formulaire
   */
  submitEvent(): void {
    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;

    // Validation basique
    if (!this.event.title || !this.event.description || !this.event.location || 
        !this.event.eventDate || !this.event.category || this.event.capacity <= 0) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      this.isSubmitting = false;
      return;
    }

    // Vérifier que le prix est >= 0 si payant
    if (!this.event.isFree && (this.event.price === undefined || this.event.price < 0)) {
      this.error = 'Veuillez entrer un prix valide.';
      this.isSubmitting = false;
      return;
    }

    // Étape 1: Créer l'événement
    this.eventService.createEvent(this.event).subscribe({
      next: (createdEvent) => {
        // Étape 2: Uploader les fichiers si présents
        if (this.hasFiles() && createdEvent.id) {
          this.uploadFiles(createdEvent.id);
        } else {
          this.showSuccess();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.error = 'Une erreur est survenue lors de la création de l\'événement.';
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Vérifier s'il y a des fichiers à uploader
   */
  hasFiles(): boolean {
    return this.selectedFiles.images.length > 0 || 
           this.selectedFiles.videos.length > 0 || 
           this.selectedFiles.documents.length > 0;
  }

  /**
   * Uploader tous les fichiers
   */
  uploadFiles(eventId: number): void {
    this.isUploadingFiles = true;
    let uploadCount = 0;
    const totalFiles = this.selectedFiles.images.length + 
                       this.selectedFiles.videos.length + 
                       this.selectedFiles.documents.length;

    // Upload images
    if (this.selectedFiles.images.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.selectedFiles.images, FileType.IMAGE).subscribe({
        next: () => {
          uploadCount += this.selectedFiles.images.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload images:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }

    // Upload videos
    if (this.selectedFiles.videos.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.selectedFiles.videos, FileType.VIDEO).subscribe({
        next: () => {
          uploadCount += this.selectedFiles.videos.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload videos:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }

    // Upload documents
    if (this.selectedFiles.documents.length > 0) {
      this.eventService.uploadMultipleFiles(eventId, this.selectedFiles.documents, FileType.DOCUMENT).subscribe({
        next: () => {
          uploadCount += this.selectedFiles.documents.length;
          this.checkUploadComplete(uploadCount, totalFiles);
        },
        error: (error) => {
          console.error('Erreur upload documents:', error);
          this.checkUploadComplete(uploadCount, totalFiles);
        }
      });
    }

    // Si aucun fichier
    if (totalFiles === 0) {
      this.showSuccess();
    }
  }

  /**
   * Vérifier si tous les uploads sont terminés
   */
  checkUploadComplete(uploadCount: number, totalFiles: number): void {
    if (uploadCount >= totalFiles) {
      this.isUploadingFiles = false;
      this.showSuccess();
    }
  }

  /**
   * Afficher le message de succès et rediriger
   */
  showSuccess(): void {
    this.successMessage = this.event.status === EventStatus.PUBLISHED 
      ? 'Événement créé et publié avec succès !' 
      : 'Événement enregistré en tant que brouillon !';
    
    this.isSubmitting = false;

    // Rediriger après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/organizer/my-events']);
    }, 2000);
  }

  /**
   * Valider le formulaire avant publication
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

    // Vérifier que la date de début est dans le futur
    const eventDate = new Date(this.event.eventDate);
    const now = new Date();
    if (eventDate <= now) {
      this.error = 'La date de l\'événement doit être dans le futur.';
      return false;
    }

    // Vérifier que la date de fin est après la date de début (si renseignée)
    if (this.event.endDate) {
      const endDate = new Date(this.event.endDate);
      if (endDate <= eventDate) {
        this.error = 'La date de fin doit être après la date de début.';
        return false;
      }
    }

    return true;
  }

  /**
   * Annuler et retourner au dashboard
   */
  cancel(): void {
    const confirmed = confirm('Êtes-vous sûr de vouloir annuler ? Les modifications ne seront pas enregistrées.');
    if (confirmed) {
      this.router.navigate(['/organizer/dashboard']);
    }
  }

  /**
   * Obtenir la taille formatée d'un fichier
   */
  getFileSize(file: File): string {
    const bytes = file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}