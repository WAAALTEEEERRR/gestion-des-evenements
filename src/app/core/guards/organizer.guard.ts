import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service'; // "service" au lieu de "services"

export const organizerGuard: CanActivateFn = (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);

  if (storageService.isLoggedIn() && storageService.isOrganizer()) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};