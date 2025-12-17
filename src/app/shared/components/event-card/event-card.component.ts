import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Event } from '../../../core/models/event.model';

type DisplayMode = 'card' | 'list';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-card.component.html'
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
  @Input() showActions: boolean = false;
  @Input() displayMode: DisplayMode = 'card';

  @Output() edit = new EventEmitter<Event>();
  @Output() delete = new EventEmitter<Event>();
  @Output() viewParticipants = new EventEmitter<Event>();

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

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

  getAvailabilityBadge(): string {
    if (!this.event.isAvailable) {
      return 'Complet';
    }
    if (this.event.availableSeats && this.event.availableSeats < 10) {
      return `${this.event.availableSeats} places`;
    }
    return 'Places disponibles';
  }

  getBadgeClass(): string {
    if (!this.event.isAvailable) {
      return 'bg-red-100 text-red-800';
    }
    if (this.event.availableSeats && this.event.availableSeats < 10) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-green-100 text-green-800';
  }

  getStatusClass(): string {
    switch (this.event.status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(): string {
    switch (this.event.status) {
      case 'PUBLISHED':
        return 'Publié';
      case 'DRAFT':
        return 'Brouillon';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return this.event.status;
    }
  }

  onEdit(): void {
    this.edit.emit(this.event);
  }

  onDelete(): void {
    this.delete.emit(this.event);
  }

  onViewParticipants(): void {
    this.viewParticipants.emit(this.event);
  }
}