import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { uuidGuard } from './core/guards/uuid.guard';

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
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/verificador/formulario-campo/formulario-campo').then(
            (m) => m.FormularioCampo,
          ),
      },
      {
        path: 'detalle-solicitud/:id',
        canActivate: [uuidGuard],
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
      { path: '', redirectTo: 'bandeja', pathMatch: 'full' },
      {
        path: 'bandeja',
        loadComponent: () =>
          import('./pages/coordinador/bandeja/bandeja').then((m) => m.Bandeja),
      },
      {
        path: 'distribuidoras',
        loadComponent: () =>
          import('./pages/coordinador/distribuidoras/distribuidoras').then((m) => m.Distribuidoras),
      },
      {
        path: 'distribuidora-detalle/:id',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/coordinador/distribuidora-detalle/distribuidora-detalle').then((m) => m.DistribuidoraDetalle),
      },
      {
        path: 'solicitar-aumento/:id',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/coordinador/solicitar-aumento/solicitar-aumento').then((m) => m.SolicitarAumento),
      },
      {
        path: 'reclutamiento',
        loadComponent: () =>
          import('./pages/coordinador/reclutamiento/reclutamiento').then((m) => m.Reclutamiento),
      },
      {
        path: 'solicitud/:id',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/coordinador/detalle-solicitud/detalle-solicitud').then(
            (m) => m.DetalleSolicitud,
          ),
      },
      {
        path: 'solicitud/:id/editar',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/coordinador/editar-solicitud/editar-solicitud').then(
            (m) => m.EditarSolicitud,
          ),
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
        path: 'seguimiento-aumento/:id',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./pages/coordinador/seguimiento-aumento/seguimiento-aumento').then((m) => m.SeguimientoAumento),
      },
      {
        path: 'transferencias',
        loadComponent: () =>
          import('./pages/coordinador/transferencias/transferencias').then(
            (m) => m.Transferencias,
          ),
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
