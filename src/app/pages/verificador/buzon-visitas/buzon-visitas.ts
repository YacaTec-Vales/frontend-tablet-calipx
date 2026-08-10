import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent, BadgeVariant } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse } from '../../../core/models/solicitud.model';

/**
 * Buzon de visitas del Verificador.
 *
 * Lista solicitudes en estado EN_VERIFICACION asignadas al verificador.
 * Permite tomar una solicitud (POST /solicitudes/:id/tomar)
 * y navegar al formulario de campo.
 */
@Component({
  selector: 'app-buzon-visitas',
  imports: [CardComponent, TableComponent, BadgeComponent, ButtonComponent, DatePipe],
  templateUrl: './buzon-visitas.html',
})
export class BuzonVisitas implements OnInit {
  private readonly router = inject(Router);
  private readonly solicitudesService = inject(SolicitudesService);

  /** Lista de solicitudes cargadas del backend */
  readonly solicitudes = signal<SolicitudResponse[]>([]);

  /** Indica si la carga esta en curso */
  readonly isLoading = signal(false);

  /** Mensaje de error al cargar */
  readonly errorMessage = signal('');

  /** ID de la solicitud que se esta tomando */
  readonly takingId = signal<string | null>(null);

  /** Indica si hay solicitudes cargadas */
  readonly isEmpty = computed(() => this.solicitudes().length === 0 && !this.isLoading());

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  /** Carga solicitudes en estado EN_VERIFICACION desde el backend */
  loadSolicitudes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.solicitudesService.list({ estado: 'EN_VERIFICACION' }).subscribe({
      next: (response) => {
        this.solicitudes.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al cargar las solicitudes.');
      },
    });
  }

  /**
   * Toma una solicitud y navega al formulario de campo.
   * POST /solicitudes/:id/tomar → navega a formulario-campo/:id
   */
  tomarSolicitud(solicitud: SolicitudResponse): void {
    this.takingId.set(solicitud.id);

    this.solicitudesService.tomar(solicitud.id).subscribe({
      next: () => {
        this.takingId.set(null);
        this.router.navigate(['/verificador/formulario-campo', solicitud.id]);
      },
      error: (err) => {
        this.takingId.set(null);
        const code = err.error?.error?.code;

        if (code === 'DISTRIBUIDORES.NOT_IN_VERIFICATION') {
          this.errorMessage.set('Esta solicitud ya fue tomada o ya no está en verificación.');
          this.loadSolicitudes(); // Refrescar lista
        } else {
          this.errorMessage.set(err.error?.message ?? 'Error al tomar la solicitud.');
        }
      },
    });
  }

  /** Navega directamente al formulario de campo (solicitud ya tomada) */
  iniciarVisita(solicitud: SolicitudResponse): void {
    this.router.navigate(['/verificador/formulario-campo', solicitud.id]);
  }

  /** Devuelve la variante del badge segun el estado */
  getBadgeVariant(estado: string): BadgeVariant {
    switch (estado) {
      case 'EN_VERIFICACION':
        return 'warning';
      case 'DICTAMINADA':
        return 'info';
      case 'AUTORIZADA':
        return 'success';
      case 'RECHAZADA':
        return 'error';
      default:
        return 'default';
    }
  }

  /** Formatea el estado para mostrar al usuario */
  formatEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }
}
