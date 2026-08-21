import { Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { DatosGenerales } from '../../../core/models/solicitud.model';
import { CommonModule } from '@angular/common';

export interface AuditoriaFormData {
  nombre?: string;
  apellido_paterno?: string;
  rfc?: string;
  calle?: string;
  numero?: string;
  colonia?: string;
  [key: string]: string | undefined;
}
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { PaginationComponent } from '../../../components/ui/pagination/pagination';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse, UpdateSolicitudDto } from '../../../core/models/solicitud.model';

@Component({
  selector: 'app-auditoria',
  imports: [CommonModule, FormsModule, InputComponent, ButtonComponent, CardComponent, TableComponent, BadgeComponent, PaginationComponent],
  templateUrl: './auditoria.html'
})
export class Auditoria implements OnInit, OnDestroy {
  private readonly solicitudesService = inject(SolicitudesService);

  readonly solicitudes = signal<SolicitudResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedSolicitud = signal<SolicitudResponse | null>(null);
  formData: AuditoriaFormData = {};
  originalData: AuditoriaFormData = {};
  
  readonly showAuditLog = signal(false);
  readonly auditChanges = signal<{ field: string, old: string, new: string }[]>([]);
  readonly isSubmitting = signal(false);

  // Pagination
  readonly itemsPerPage = signal(10);
  readonly currentPage = signal(1);

  readonly searchQuery = signal('');
  readonly currentFilter = signal<string>('');

  readonly filteredSolicitudes = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();
    const filter = this.currentFilter();
    let all = this.solicitudes();

    if (filter) {
      all = all.filter(s => s.estado === filter);
    }

    if (search) {
      all = all.filter(s => {
        const text = `${s.folio || ''} ${s.datos_generales.nombre} ${s.datos_generales.apellido_paterno} ${s.datos_generales.rfc || ''}`.toLowerCase();
        return text.includes(search);
      });
    }

    return all;
  });

  readonly paginatedSolicitudes = computed(() => {
    const all = this.filteredSolicitudes();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return all.slice(start, start + this.itemsPerPage());
  });

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit() {
    this.loadSolicitudes();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  loadSolicitudes(isBackground = false) {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    if (!isBackground) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }
    this.solicitudesService.list().subscribe({
      next: (res) => {
        // Filtramos solo las solicitudes en un estado auditable (ej. EN_VERIFICACION o DICTAMINADA)
        // Para que la bandeja no se sature de solicitudes finalizadas.
        const auditables = res.data.filter(s => s.estado === 'EN_VERIFICACION' || s.estado === 'DICTAMINADA');
        this.solicitudes.set(auditables);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: (err) => {
        if (!isBackground) {
          this.errorMessage.set(err.error?.message || 'Error al cargar las solicitudes');
          this.isLoading.set(false);
        }
        this.scheduleNextPoll();
      }
    });
  }

  private scheduleNextPoll() {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.loadSolicitudes(true);
    }, 15000);
  }

  seleccionar(solicitud: SolicitudResponse) {
    this.selectedSolicitud.set(solicitud);
    this.errorMessage.set(null);
    
    // Extraemos solo lo que se puede auditar/editar
    const d = solicitud.datos_generales;
    const editableData = {
      nombre: d.nombre,
      apellido_paterno: d.apellido_paterno,
      rfc: d.rfc,
      calle: d.calle,
      numero: d.numero,
      colonia: d.colonia
    };

    this.formData = { ...editableData };
    this.originalData = { ...editableData };
    this.showAuditLog.set(false);
    this.auditChanges.set([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverLista() {
    this.selectedSolicitud.set(null);
    this.errorMessage.set(null);
  }

  revisarCambios() {
    const changes: { field: string, old: string, new: string }[] = [];
    ['nombre', 'apellido_paterno', 'rfc', 'calle', 'numero', 'colonia'].forEach(field => {
      if (this.formData[field] !== this.originalData[field]) {
        changes.push({
          field,
          old: this.originalData[field] || '',
          new: this.formData[field] || ''
        });
      }
    });

    this.auditChanges.set(changes);

    if (changes.length > 0) {
      this.showAuditLog.set(true);
    } else {
      this.errorMessage.set("No hay cambios que guardar.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarGuardado() {
    this.showAuditLog.set(false);
  }

  confirmarGuardado() {
    const solicitud = this.selectedSolicitud();
    if (!solicitud) return;
    
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const dto: UpdateSolicitudDto = {
      datos_generales: {
        ...solicitud.datos_generales,
        ...this.formData
      } as unknown as DatosGenerales // Casteamos para cumplir con el DTO sin usar any
    };
    
    this.solicitudesService.update(solicitud.id, dto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showAuditLog.set(false);
        this.selectedSolicitud.set(null); // Vuelve a la lista
        this.loadSolicitudes(); // Recarga la lista
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar los cambios de auditoría');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
