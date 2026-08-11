import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse, EstadoSolicitud } from '../../../core/models/solicitud.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { PaginationComponent } from '../../../components/ui/pagination/pagination';

@Component({
  selector: 'app-bandeja-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, PaginationComponent],
  templateUrl: './bandeja.html',
})
export class Bandeja implements OnInit, OnDestroy {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly router = inject(Router);

  readonly solicitudes = signal<SolicitudResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentFilter = signal<EstadoSolicitud | ''>('');

  // Pagination
  readonly itemsPerPage = signal(10);
  readonly currentPage = signal(1);

  readonly paginatedSolicitudes = computed(() => {
    const all = this.solicitudes();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return all.slice(start, start + this.itemsPerPage());
  });

  private pollingTimer: any;
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

  loadSolicitudes(estado?: string, isBackground = false): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    if (!isBackground) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }
    if (estado !== undefined) {
      this.currentFilter.set(estado as EstadoSolicitud | '');
    }

    const filters = this.currentFilter() ? { estado: this.currentFilter() as EstadoSolicitud } : undefined;

    this.solicitudesService.list(filters).subscribe({
      next: (res) => {
        this.solicitudes.set(res.data || []);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: (err) => {
        if (!isBackground) {
          this.errorMessage.set(err.error?.message || 'Error al cargar las solicitudes');
          this.isLoading.set(false);
        }
        this.scheduleNextPoll();
      },
    });
  }

  private scheduleNextPoll(): void {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.loadSolicitudes(undefined, true);
    }, 15000);
  }

  verDetalle(id: string): void {
    this.router.navigate(['/coordinador/solicitud', id]);
  }

  editarSolicitud(id: string): void {
    this.router.navigate(['/coordinador/solicitud', id, 'editar']);
  }

  get isEmpty(): boolean {
    return this.solicitudes().length === 0;
  }

  formatEstado(estado: EstadoSolicitud): string {
    const map: Record<EstadoSolicitud, string> = {
      PRE_SOLICITUD: 'Pre-Solicitud',
      EN_VERIFICACION: 'En Verificación',
      DICTAMINADA: 'Dictaminada',
      AUTORIZADA: 'Autorizada',
      RECHAZADA: 'Rechazada',
    };
    return map[estado] || estado;
  }

  getBadgeVariant(estado: EstadoSolicitud): 'success' | 'warning' | 'error' | 'info' {
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
