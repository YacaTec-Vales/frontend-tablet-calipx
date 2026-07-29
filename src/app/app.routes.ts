import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout as VerificadorLayout } from './pages/verificador/layout/layout';
import { BuzonVisitas } from './pages/verificador/buzon-visitas/buzon-visitas';
import { DetalleSolicitud } from './pages/verificador/detalle-solicitud/detalle-solicitud';
import { FormularioCampo } from './pages/verificador/formulario-campo/formulario-campo';

import { Layout as AdminLayout } from './pages/admin/layout/layout';
import { PuntoAtencion } from './pages/admin/punto-atencion/punto-atencion';
import { CajaDispersion } from './pages/admin/caja-dispersion/caja-dispersion';
import { CargaArchivos } from './pages/admin/carga-archivos/carga-archivos';
import { Conciliacion } from './pages/admin/conciliacion/conciliacion';
import { Tokens } from './pages/admin/tokens/tokens';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'verificador', 
    component: VerificadorLayout,
    children: [
      { path: '', redirectTo: 'buzon-visitas', pathMatch: 'full' },
      { path: 'buzon-visitas', component: BuzonVisitas },
      { path: 'detalle-solicitud', component: DetalleSolicitud },
      { path: 'formulario-campo', component: FormularioCampo }
    ]
  },
  { 
    path: 'admin', 
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'punto-atencion', pathMatch: 'full' },
      { path: 'punto-atencion', component: PuntoAtencion },
      { path: 'caja-dispersion', component: CajaDispersion },
      { path: 'carga-archivos', component: CargaArchivos },
      { path: 'conciliacion', component: Conciliacion },
      { path: 'tokens', component: Tokens }
    ]
  }
];
