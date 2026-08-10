import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
  },

  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/change-password/change-password').then((m) => m.ChangePassword),
    canActivate: [authGuard],
  },

  {
    path: 'verificador',
    loadComponent: () =>
      import('./pages/verificador/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard, roleGuard('VERIFICADOR')],
    children: [
      { path: '', redirectTo: 'buzon-visitas', pathMatch: 'full' },
      {
        path: 'buzon-visitas',
        loadComponent: () =>
          import('./pages/verificador/buzon-visitas/buzon-visitas').then((m) => m.BuzonVisitas),
      },
      {
        path: 'formulario-campo/:id',
        loadComponent: () =>
          import('./pages/verificador/formulario-campo/formulario-campo').then(
            (m) => m.FormularioCampo,
          ),
      },
      {
        path: 'detalle-solicitud/:id',
        loadComponent: () =>
          import('./pages/verificador/detalle-solicitud/detalle-solicitud').then(
            (m) => m.DetalleSolicitud,
          ),
      },
    ],
  },

  {
    path: 'coordinador',
    loadComponent: () =>
      import('./pages/coordinador/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard, roleGuard('COORDINADOR')],
    children: [
      { path: '', redirectTo: 'reclutamiento', pathMatch: 'full' },
      {
        path: 'reclutamiento',
        loadComponent: () =>
          import('./pages/coordinador/reclutamiento/reclutamiento').then((m) => m.Reclutamiento),
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./pages/coordinador/auditoria/auditoria').then((m) => m.Auditoria),
      },
      {
        path: 'incentivos',
        loadComponent: () =>
          import('./pages/coordinador/incentivos/incentivos').then((m) => m.Incentivos),
      },
      {
        path: 'transferencias',
        loadComponent: () =>
          import('./pages/coordinador/transferencias/transferencias').then(
            (m) => m.Transferencias,
          ),
      },
      {
        path: 'punto-atencion',
        loadComponent: () =>
          import('./pages/coordinador/punto-atencion/punto-atencion').then(
            (m) => m.PuntoAtencion,
          ),
      },
      {
        path: 'caja-dispersion',
        loadComponent: () =>
          import('./pages/coordinador/caja-dispersion/caja-dispersion').then(
            (m) => m.CajaDispersion,
          ),
      },
      {
        path: 'carga-archivos',
        loadComponent: () =>
          import('./pages/coordinador/carga-archivos/carga-archivos').then(
            (m) => m.CargaArchivos,
          ),
      },
      {
        path: 'conciliacion',
        loadComponent: () =>
          import('./pages/coordinador/conciliacion/conciliacion').then((m) => m.Conciliacion),
      },
      {
        path: 'tokens',
        loadComponent: () =>
          import('./pages/coordinador/tokens/tokens').then((m) => m.Tokens),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
