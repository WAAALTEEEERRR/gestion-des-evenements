import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  // Injection des dépendances
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Formulaire d'inscription
  registerForm: FormGroup;

  // États du composant
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  // Enum des rôles (pour le template)
  userRoles = [
    { value: UserRole.PARTICIPANT, label: 'Participant', icon: '👤', description: 'Je veux participer aux événements' },
    { value: UserRole.ORGANIZER, label: 'Organisateur', icon: '👔', description: 'Je veux créer et gérer des événements' }
  ];

  constructor() {
    // Initialisation du formulaire avec validation
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      role: [UserRole.PARTICIPANT, [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  /**
   * VALIDATEUR PERSONNALISÉ : Vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Getters pour accéder facilement aux contrôles du formulaire
   */
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get phone() { return this.registerForm.get('phone'); }
  get role() { return this.registerForm.get('role'); }

  /**
   * Afficher/Masquer le mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * SOUMISSION DU FORMULAIRE
   */
  onSubmit(): void {
    // Vérifier que le formulaire est valide
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Activer le loading
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Préparer les données d'inscription
    const userData: User = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      phone: this.registerForm.value.phone || undefined,
      role: this.registerForm.value.role
    };

    // Appel à l'API via AuthService
    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('✅ Inscription réussie :', response);
        
        // Afficher le message de succès
        this.successMessage = 'Inscription réussie ! Redirection vers la page de connexion...';
        
        // Rediriger vers le login après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Erreur d\'inscription :', error);
        this.isLoading = false;

        // Message d'erreur personnalisé
        if (error.status === 409 || error.error?.message?.includes('existe déjà')) {
          this.errorMessage = 'Un compte avec cet email existe déjà';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
        } else {
          this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Sélectionner un rôle (pour le design avec cartes)
   */
  selectRole(role: UserRole): void {
    this.registerForm.patchValue({ role });
  }
}