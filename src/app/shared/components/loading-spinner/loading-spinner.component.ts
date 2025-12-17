import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html'
})
export class LoadingSpinnerComponent {
  /**
   * Message à afficher sous le spinner
   * Par défaut : "Chargement..."
   */
  @Input() message: string = 'Chargement...';

  /**
   * Taille du spinner
   * Options : 'small', 'medium', 'large'
   * Par défaut : 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Afficher en plein écran (overlay)
   * Par défaut : false
   */
  @Input() fullScreen: boolean = false;

  /**
   * Obtenir la classe CSS de la taille
   */
  getSizeClass(): string {
    switch (this.size) {
      case 'small':
        return 'h-6 w-6';
      case 'large':
        return 'h-16 w-16';
      default:
        return 'h-12 w-12';
    }
  }
}