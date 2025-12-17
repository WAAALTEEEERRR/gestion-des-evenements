import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  // Injection des dépendances
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Formulaire de connexion
  loginForm: FormGroup;

  // États du composant
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    // Initialisation du formulaire avec validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Getter pour accéder facilement aux contrôles du formulaire
   */
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

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
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Activer le loading
    this.isLoading = true;
    this.errorMessage = '';

    // Préparer les données de connexion
    const credentials: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // Appel à l'API via AuthService
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Connexion réussie :', response);

        // Redirection selon le rôle
        if (response.role === 'ORGANIZER') {
          this.router.navigate(['/organizer/dashboard']);
        } else if (response.role === 'PARTICIPANT') {
          this.router.navigate(['/participant/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        console.error('❌ Erreur de connexion :', error);
        this.isLoading = false;

        // Message d'erreur personnalisé
        if (error.status === 404 || error.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
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
}