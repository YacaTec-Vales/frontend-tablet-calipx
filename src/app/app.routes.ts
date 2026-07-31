import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout as VerificadorLayout } from './pages/verificador/layout/layout';
import { BuzonVisitas } from './pages/verificador/buzon-visitas/buzon-visitas';
import { FormularioCampo } from './pages/verificador/formulario-campo/formulario-campo';

import { Layout as CoordinadorLayout } from './pages/coordinador/layout/layout';
import { Reclutamiento } from './pages/coordinador/reclutamiento/reclutamiento';
import { Auditoria } from './pages/coordinador/auditoria/auditoria';
import { Incentivos } from './pages/coordinador/incentivos/incentivos';
import { Transferencias } from './pages/coordinador/transferencias/transferencias';
import { PuntoAtencion } from './pages/coordinador/punto-atencion/punto-atencion';
import { CajaDispersion } from './pages/coordinador/caja-dispersion/caja-dispersion';
import { CargaArchivos } from './pages/coordinador/carga-archivos/carga-archivos';
import { Conciliacion } from './pages/coordinador/conciliacion/conciliacion';
import { Tokens } from './pages/coordinador/tokens/tokens';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'verificador', 
    component: VerificadorLayout,
    children: [
      { path: '', redirectTo: 'buzon-visitas', pathMatch: 'full' },
      { path: 'buzon-visitas', component: BuzonVisitas },
      { path: 'formulario-campo', component: FormularioCampo }
    ]
  },
  { 
    path: 'coordinador', 
    component: CoordinadorLayout,
    children: [
      { path: '', redirectTo: 'reclutamiento', pathMatch: 'full' },
      { path: 'reclutamiento', component: Reclutamiento },
      { path: 'auditoria', component: Auditoria },
      { path: 'incentivos', component: Incentivos },
      { path: 'transferencias', component: Transferencias },
      { path: 'punto-atencion', component: PuntoAtencion },
      { path: 'caja-dispersion', component: CajaDispersion },
      { path: 'carga-archivos', component: CargaArchivos },
      { path: 'conciliacion', component: Conciliacion },
      { path: 'tokens', component: Tokens }
    ]
  }
];
