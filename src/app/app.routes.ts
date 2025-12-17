import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { organizerGuard } from './core/guards/organizer.guard';
import { participantGuard } from './core/guards/participant.guard';

export const routes: Routes = [
  // ==========================================
  // 🏠 ROUTES PUBLIQUES
  // ==========================================
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ==========================================
  // 📅 ROUTES ÉVÉNEMENTS (PUBLIQUES)
  // ==========================================
  {
    path: 'events',
    loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'events/search',
    loadComponent: () => import('./features/events/event-search/event-search.component').then(m => m.EventSearchComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/event-details/event-details.component').then(m => m.EventDetailsComponent)
  },

  // ==========================================
  // 👔 ROUTES ORGANISATEUR
  // ==========================================
  {
    path: 'organizer/dashboard',
    canActivate: [organizerGuard],
    loadComponent: () => import('./features/organizer/organizer-dashboard/organizer-dashboard.component').then(m => m.OrganizerDashboardComponent)
  },
  {
    path: 'organizer/create-event',
    canActivate: [organizerGuard],
    loadComponent: () => import('./features/organizer/create-event/create-event.component').then(m => m.CreateEventComponent)
  },
  {
    path: 'organizer/my-events',
    canActivate: [organizerGuard],
    loadComponent: () => import('./features/organizer/my-events/my-events.component').then(m => m.MyEventsComponent)
  },
  {
    path: 'organizer/edit-event/:id',
    canActivate: [organizerGuard],
    loadComponent: () => import('./features/organizer/edit-event/edit-event.component').then(m => m.EditEventComponent)
  },
  {
    path: 'organizer/participants/:id',
    canActivate: [organizerGuard],
    loadComponent: () => import('./features/organizer/participants-management/participants-management.component').then(m => m.ParticipantsManagementComponent)
  },
  {
  path: 'organizer/statistics',
  canActivate: [organizerGuard],
  loadComponent: () => import('./features/organizer/event-statistics/event-statistics.component').then(m => m.EventStatisticsComponent)
  },

  // ==========================================
  // 👤 ROUTES PARTICIPANT
  // ==========================================
  {
    path: 'participant/dashboard',
    canActivate: [participantGuard],
    loadComponent: () => import('./features/participant/participant-dashboard/participant-dashboard.component').then(m => m.ParticipantDashboardComponent)
  },
  {
  path: 'participant/my-registrations',
  canActivate: [participantGuard],
  loadComponent: () => import('./features/participant/my-registrations/my-registrations.component').then(m => m.MyRegistrationsComponent)
  },

  // ==========================================
  // 🔔 ROUTES NOTIFICATIONS (NOUVEAU !)
  // ==========================================
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent)
  },

  // ==========================================
  // 👤 ROUTE PROFIL
  // ==========================================
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },

  // ==========================================
  // ❌ ROUTE 404
  // ==========================================
  {
    path: '**',
    redirectTo: '/login'
  }
];