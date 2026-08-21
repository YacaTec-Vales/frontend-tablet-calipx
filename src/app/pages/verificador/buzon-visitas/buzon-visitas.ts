import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
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
export class BuzonVisitas implements OnInit, OnDestroy {
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
  
  readonly searchQuery = signal('');

  readonly filteredSolicitudes = computed(() => {
    let all = this.solicitudes();
    const search = this.searchQuery().toLowerCase().trim();
    
    if (search) {
      all = all.filter(s => {
        const text = `${s.folio || ''} ${s.datos_generales.nombre} ${s.datos_generales.apellido_paterno} ${s.datos_generales.apellido_materno} ${s.datos_generales.curp || ''}`.toLowerCase();
        return text.includes(search);
      });
    }
    
    return all;
  });

  /** Indica si hay solicitudes cargadas */
  readonly isEmpty = computed(() => this.filteredSolicitudes().length === 0 && !this.isLoading());

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  /** Carga solicitudes en estado EN_VERIFICACION desde el backend */
  loadSolicitudes(isBackground = false): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    if (!isBackground) {
      this.isLoading.set(true);
      this.errorMessage.set('');
    }

    this.solicitudesService.list({ estado: 'EN_VERIFICACION' }).subscribe({
      next: (response) => {
        this.solicitudes.set(response.data);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: (err) => {
        if (!isBackground) {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message ?? 'Error al cargar las solicitudes.');
        }
        this.scheduleNextPoll();
      },
    });
  }

  private scheduleNextPoll(): void {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.loadSolicitudes(true);
    }, 15000);
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
