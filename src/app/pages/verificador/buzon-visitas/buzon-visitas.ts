import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';

interface PreSolicitud {
  folio: string;
  nombre: string;
  direccion: string;
  fechaAsignada: string;
  estado: 'Pendiente' | 'En Proceso';
}

@Component({
  selector: 'app-buzon-visitas',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent],
  templateUrl: './buzon-visitas.html'
})
export class BuzonVisitas {
  solicitudes: PreSolicitud[] = [
    { folio: 'PRE-0091', nombre: 'Karla Sánchez', direccion: 'Calle de los Olivos 442', fechaAsignada: '2026-10-15', estado: 'Pendiente' },
    { folio: 'PRE-0092', nombre: 'Patricia Ramos', direccion: 'Av. Las Palmas 91, Sur', fechaAsignada: '2026-10-15', estado: 'Pendiente' },
    { folio: 'PRE-0095', nombre: 'Fernanda Ortiz', direccion: 'Col. Santa María', fechaAsignada: '2026-10-16', estado: 'Pendiente' },
  ];

  constructor(private router: Router) {}

  iniciarVisita(folio: string) {
    this.router.navigate(['/verificador/formulario-campo'], { queryParams: { folio } });
  }
}
