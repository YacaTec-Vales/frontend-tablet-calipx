import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse } from '../../../core/models/solicitud.model';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { BadgeComponent } from '../../../components/ui/badge/badge';

@Component({
  selector: 'app-detalle-solicitud-coordinador',
  imports: [CommonModule, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './detalle-solicitud.html',
})
export class DetalleSolicitud implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly currentTab = signal<'GENERALES' | 'DOMICILIO' | 'VEHICULOS' | 'LABORALES' | 'CREDITOS' | 'FAMILIARES'>('GENERALES');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSolicitud(id);
    } else {
      this.errorMessage.set('ID de solicitud no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadSolicitud(id: string): void {
    this.solicitudesService.getById(id).subscribe({
      next: (res) => {
        this.solicitud.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar la solicitud');
        this.isLoading.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/coordinador/bandeja']);
  }

  editar(): void {
    const s = this.solicitud();
    if (s) {
      this.router.navigate(['/coordinador/solicitud', s.id, 'editar']);
    }
  }

  formatEstado(estado: string): string {
    const map: Record<string, string> = {
      PRE_SOLICITUD: 'Pre-Solicitud',
      EN_VERIFICACION: 'En Verificación',
      DICTAMINADA: 'Dictaminada',
      AUTORIZADA: 'Autorizada',
      RECHAZADA: 'Rechazada',
    };
    return map[estado] || estado;
  }

  getBadgeVariant(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'EN_VERIFICACION':
        return 'info';
      case 'DICTAMINADA':
        return 'warning';
      case 'AUTORIZADA':
        return 'success';
      case 'RECHAZADA':
        return 'error';
      default:
        return 'info';
    }
  }
}
