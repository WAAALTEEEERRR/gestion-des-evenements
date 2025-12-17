import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { StorageService } from '../../../core/services/storage.service';
import { Notification, NotificationStatus, NotificationType } from '../../../core/models/notification.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type TimeFilter = 'today' | 'yesterday' | 'week' | 'older';

interface NotificationGroup {
  label: string;
  notifications: Notification[];
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './notification-list.component.html'
})
export class NotificationListComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Données utilisateur
  userId: number | null = null;

  // Notifications
  allNotifications: Notification[] = [];
  groupedNotifications: NotificationGroup[] = [];

  // UI States
  isLoading = false;
  unreadCount = 0;

  // Confirmation de suppression
  showDeleteAllDialog = false;
  isDeletingAll = false;

  // Message de succès
  showSuccessMessage = false;
  successMessage = '';

  ngOnInit(): void {
    this.userId = this.storageService.getUserId();

    if (this.userId) {
      this.loadNotifications();
      this.loadUnreadCount();
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Charger toutes les notifications de l'utilisateur
   */
  loadNotifications(): void {
    if (!this.userId) return;

    this.isLoading = true;

    this.notificationService.getUserNotifications(this.userId).subscribe({
      next: (notifications) => {
        this.allNotifications = notifications;
        this.groupNotificationsByDate();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger le nombre de notifications non lues
   */
  loadUnreadCount(): void {
    if (!this.userId) return;

    this.notificationService.getUnreadCount(this.userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du compteur:', error);
      }
    });
  }

  /**
   * Grouper les notifications par date
   */
  groupNotificationsByDate(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      week: [],
      older: []
    };

    this.allNotifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt!);
      const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDateOnly.getTime() === today.getTime()) {
        groups['today'].push(notification);
      } else if (notifDateOnly.getTime() === yesterday.getTime()) {
        groups['yesterday'].push(notification);
      } else if (notifDate >= weekAgo) {
        groups['week'].push(notification);
      } else {
        groups['older'].push(notification);
      }
    });

    // Créer les groupes avec labels
    this.groupedNotifications = [];

    if (groups['today'].length > 0) {
      this.groupedNotifications.push({
        label: 'Aujourd\'hui',
        notifications: groups['today']
      });
    }

    if (groups['yesterday'].length > 0) {
      this.groupedNotifications.push({
        label: 'Hier',
        notifications: groups['yesterday']
      });
    }

    if (groups['week'].length > 0) {
      this.groupedNotifications.push({
        label: 'Cette semaine',
        notifications: groups['week']
      });
    }

    if (groups['older'].length > 0) {
      this.groupedNotifications.push({
        label: 'Plus anciennes',
        notifications: groups['older']
      });
    }
  }

  /**
   * Marquer une notification comme lue et rediriger si nécessaire
   */
  handleNotificationClick(notification: Notification): void {
    // Marquer comme lue si non lue
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

    // Rediriger vers l'événement si la notification est liée à un événement
    if (notification.eventId) {
      this.router.navigate(['/events', notification.eventId]);
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): void {
    if (!this.userId) return;

    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => {
        this.allNotifications.forEach(notif => notif.status = NotificationStatus.READ);
        this.unreadCount = 0;
        this.groupNotificationsByDate(); // Regrouper à nouveau

        this.showSuccessToast('Toutes les notifications ont été marquées comme lues');
      },
      error: (error) => {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  /**
   * Ouvrir la popup de confirmation de suppression
   */
  openDeleteAllDialog(): void {
    this.showDeleteAllDialog = true;
  }

  /**
   * Fermer la popup de confirmation
   */
  closeDeleteAllDialog(): void {
    this.showDeleteAllDialog = false;
  }

  /**
   * Confirmer la suppression de toutes les notifications
   */
  confirmDeleteAll(): void {
    if (!this.userId) return;

    this.isDeletingAll = true;

    this.notificationService.deleteAllNotifications(this.userId).subscribe({
      next: () => {
        this.isDeletingAll = false;
        this.closeDeleteAllDialog();
        
        this.allNotifications = [];
        this.groupedNotifications = [];
        this.unreadCount = 0;

        this.showSuccessToast('Toutes les notifications ont été supprimées');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.isDeletingAll = false;
        alert('Une erreur est survenue lors de la suppression. Veuillez réessayer.');
      }
    });
  }

  /**
   * Supprimer une notification individuelle
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation(); // Empêcher le clic sur la notification

    if (!notification.id) return;

    if (confirm(`Supprimer cette notification ?`)) {
      this.notificationService.deleteNotification(notification.id).subscribe({
        next: () => {
          // Retirer la notification de la liste
          this.allNotifications = this.allNotifications.filter(n => n.id !== notification.id);
          this.groupNotificationsByDate();

          // Mettre à jour le compteur si non lue
          if (notification.status !== NotificationStatus.READ) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }

          this.showSuccessToast('Notification supprimée');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Une erreur est survenue. Veuillez réessayer.');
        }
      });
    }
  }

  /**
   * Afficher un message de succès temporaire
   */
  showSuccessToast(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;

    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  /**
   * Fermer le message de succès
   */
  closeSuccessMessage(): void {
    this.showSuccessMessage = false;
  }

  /**
   * Obtenir l'icône selon le type de notification
   */
  getNotificationIcon(type: NotificationType): string {
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
   * Obtenir la classe CSS de l'icône selon le type
   */
  getIconBgClass(type: NotificationType): string {
    const classes: { [key: string]: string } = {
      'REGISTRATION_CONFIRMATION': 'bg-green-100',
      'REGISTRATION_CANCELLED': 'bg-red-100',
      'EVENT_UPDATED': 'bg-blue-100',
      'EVENT_CANCELLED': 'bg-red-100',
      'EVENT_REMINDER': 'bg-yellow-100',
      'EVENT_STARTING_SOON': 'bg-purple-100',
      'EVENT_COMPLETED': 'bg-green-100',
      'NEW_EVENT_PUBLISHED': 'bg-blue-100',
      'REGISTRATION_STATUS_CHANGED': 'bg-orange-100',
      'GENERAL': 'bg-gray-100'
    };
    return classes[type] || 'bg-gray-100';
  }

  /**
   * Formater la date et l'heure
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formater le temps relatif (il y a X minutes/heures)
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
    } else {
      return `Il y a ${diffDays}j`;
    }
  }

  /**
   * Vérifier si une notification est non lue
   */
  isUnread(notification: Notification): boolean {
    return notification.status !== NotificationStatus.READ;
  }
}