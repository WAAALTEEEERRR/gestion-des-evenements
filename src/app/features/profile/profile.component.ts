import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { StorageService } from '../../core/services/storage.service';
import { User, UserRole } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Formulaire
  profileForm!: FormGroup;

  // Données utilisateur
  user: User | null = null;
  userId: number | null = null;

  // UI States
  isLoading = false;
  isSaving = false;
  isEditing = false;

  // Messages
  showSuccessMessage = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.userId = this.storageService.getUserId();
    this.user = this.storageService.getUser();

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
    this.loadUserProfile();
  }

  /**
   * Initialiser le formulaire
   */
  initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]] // 10 chiffres
    });

    // Désactiver le formulaire par défaut (mode lecture)
    this.profileForm.disable();
  }

  /**
   * Charger le profil utilisateur depuis l'API
   */
  loadUserProfile(): void {
    if (!this.userId) return;

    this.isLoading = true;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm(user);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.errorMessage = 'Impossible de charger votre profil. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Remplir le formulaire avec les données utilisateur
   */
  populateForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || ''
    });
  }

  /**
   * Activer le mode édition
   */
  enableEditing(): void {
    this.isEditing = true;
    this.profileForm.enable();
    this.errorMessage = '';
  }

  /**
   * Annuler les modifications
   */
  cancelEditing(): void {
    this.isEditing = false;
    this.profileForm.disable();
    this.errorMessage = '';
    
    // Remettre les valeurs d'origine
    if (this.user) {
      this.populateForm(this.user);
    }
  }

  /**
   * Sauvegarder les modifications
   */
  saveProfile(): void {
    if (this.profileForm.invalid || !this.userId || !this.user) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const updatedUser: User = {
      ...this.user,
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      phone: this.profileForm.value.phone || undefined
    };

    this.userService.updateUser(this.userId, updatedUser).subscribe({
      next: (user) => {
        this.user = user;
        this.isSaving = false;
        this.isEditing = false;
        this.profileForm.disable();

        // Mettre à jour le StorageService
        this.storageService.saveUser(user);

        // Afficher le message de succès
        this.successMessage = 'Votre profil a été mis à jour avec succès !';
        this.showSuccessMessage = true;

        // Cacher le message après 5 secondes
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde:', error);
        this.errorMessage = 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.';
        this.isSaving = false;
      }
    });
  }

  /**
   * Obtenir le libellé du rôle
   */
  getRoleLabel(role?: UserRole): string {
    if (role === UserRole.ORGANIZER) {
      return 'Organisateur';
    } else if (role === UserRole.PARTICIPANT) {
      return 'Participant';
    }
    return 'Non défini';
  }

  /**
   * Obtenir la classe CSS du badge de rôle
   */
  getRoleBadgeClass(role?: UserRole): string {
    if (role === UserRole.ORGANIZER) {
      return 'bg-purple-100 text-purple-800';
    } else if (role === UserRole.PARTICIPANT) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Formater la date de création
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Fermer le message de succès
   */
  closeSuccessMessage(): void {
    this.showSuccessMessage = false;
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }

    if (field?.hasError('pattern') && fieldName === 'phone') {
      return 'Le numéro doit contenir exactement 10 chiffres';
    }

    return '';
  }
}