import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { StorageService } from '../../../core/services/storage.service';
import { Notification, NotificationStatus } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-bell.component.html'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private storageService = inject(StorageService);

  // États
  isDropdownOpen = false;
  unreadCount = 0;
  recentNotifications: Notification[] = [];
  isLoading = false;

  // Subscription pour le rafraîchissement automatique
  private refreshSubscription?: Subscription;

  ngOnInit(): void {
    this.loadNotifications();
    
    // Rafraîchir les notifications toutes les 30 secondes
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  /**
   * Charger les notifications récentes et le compteur
   */
  loadNotifications(): void {
    const userId = this.storageService.getUserId();
    
    if (!userId) {
      return;
    }

    // Charger le nombre de notifications non lues
    this.notificationService.getUnreadCount(userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du compteur:', error);
      }
    });

    // Charger les notifications récentes (si le dropdown est ouvert)
    if (this.isDropdownOpen) {
      this.isLoading = true;
      this.notificationService.getRecentNotifications(userId).subscribe({
        next: (notifications) => {
          this.recentNotifications = notifications.slice(0, 5); // Limiter à 5 notifications
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications:', error);
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Basculer l'ouverture du dropdown
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      this.loadNotifications();
    }
  }

  /**
   * Fermer le dropdown
   */
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notification: Notification): void {
    if (notification.id && notification.status !== NotificationStatus.READ) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.status = NotificationStatus.READ;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          console.error('Erreur lors du marquage comme lu:', error);
        }
      });
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const userId = this.storageService.getUserId();
    
    if (!userId) {
      return;
    }

    this.notificationService.markAllAsRead(userId).subscribe({
      next: () => {
        this.unreadCount = 0;
        this.recentNotifications.forEach(notif => notif.status = NotificationStatus.READ);
      },
      error: (error) => {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
      }
    });
  }

  /**
   * Obtenir l'icône selon le type de notification
   */
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'REGISTRATION_CONFIRMATION': '✅',
      'REGISTRATION_CANCELLED': '❌',
      'EVENT_UPDATED': '🔄',
      'EVENT_CANCELLED': '🚫',
      'EVENT_REMINDER': '⏰',
      'EVENT_STARTING_SOON': '🔔',
      'EVENT_COMPLETED': '🎉',
      'NEW_EVENT_PUBLISHED': '🆕',
      'REGISTRATION_STATUS_CHANGED': '📝',
      'GENERAL': '📬'
    };
    return icons[type] || '📬';
  }

  /**
   * Formater la date relative (il y a X minutes/heures/jours)
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  }

  /**
   * Vérifier si une notification est non lue
   */
  isUnread(notification: Notification): boolean {
    return notification.status !== NotificationStatus.READ;
  }
}