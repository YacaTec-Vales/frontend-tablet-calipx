import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const uuidGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Buscar el param 'id' si existe
  const id = route.paramMap.get('id');
  if (id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn(`Intento de acceso a ruta con ID no válido: ${id}`);
      router.navigate(['/404']);
      return false;
    }
  }

  return true;
};
