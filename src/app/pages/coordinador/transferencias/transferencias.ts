import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { AutorizacionesService, AuthorizationResponseDto } from '../../../core/services/autorizaciones.service';

@Component({
  selector: 'app-transferencias',
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent],
  templateUrl: './transferencias.html'
})
export class Transferencias implements OnInit {
  private autorizacionesService = inject(AutorizacionesService);

  solicitudes = signal<AuthorizationResponseDto[]>([]);
  isLoading = signal(true);

  selectedSolicitud: AuthorizationResponseDto | null = null;
  actionType: 'approve' | 'reject' | null = null;
  motivoRechazo: string = '';
  isProcessing = false;

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.autorizacionesService.getAutorizaciones().subscribe({
      next: (res) => {
        // Filtrar solo las transferencias pendientes
        const pendientes = (res.data || []).filter(
          a => a.authorizationType === 'TRANSFERENCIA_DISTRIBUIDOR' && a.status === 'PENDING'
        );
        this.solicitudes.set(pendientes);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar las solicitudes de transferencia.');
      }
    });
  }

  // getters para el HTML, usando affectedEntity
  getClienteNombre(solicitud: AuthorizationResponseDto): string {
    return solicitud.affectedEntity?.clientName || solicitud.affectedEntity?.clienteNombre || 'Cliente Desconocido';
  }

  getDistribuidoraOrigen(solicitud: AuthorizationResponseDto): string {
    return solicitud.affectedEntity?.oldDistributorName || solicitud.affectedEntity?.distribuidoraActual || 'Origen Desconocido';
  }

  getDistribuidoraDestino(solicitud: AuthorizationResponseDto): string {
    return solicitud.affectedEntity?.newDistributorName || solicitud.affectedEntity?.distribuidoraNueva || 'Destino Desconocido';
  }

  seleccionar(solicitud: AuthorizationResponseDto) {
    this.selectedSolicitud = solicitud;
    this.actionType = null;
    this.motivoRechazo = '';
  }

  volverLista() {
    this.selectedSolicitud = null;
    this.actionType = null;
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  setAction(type: 'approve' | 'reject' | null) {
    this.actionType = type;
  }

  procesar() {
    if (!this.selectedSolicitud) return;

    this.isProcessing = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.actionType === 'approve') {
      const dto = {
        notes: 'Aprobado por coordinador'
      };

      this.autorizacionesService.approveAutorizacion(this.selectedSolicitud.id, dto).subscribe({
        next: () => {
          this.solicitudes.update(list => list.filter(s => s.id !== this.selectedSolicitud?.id));
          this.isProcessing = false;
          this.selectedSolicitud = null;
          this.actionType = null;
          this.successMessage.set('Transferencia aprobada correctamente.');
        },
        error: (err) => {
          this.isProcessing = false;
          let msg = err.error?.message || 'Error al aprobar la transferencia.';
          if (err.error?.error?.details?.violations?.length) {
            msg = err.error.error.details.violations[0];
          } else if (Array.isArray(err.error?.message)) {
            msg = err.error.message[0];
          }
          this.errorMessage.set(msg);
        }
      });
    } else if (this.actionType === 'reject') {
      const dto = {
        reason: this.motivoRechazo
      };

      this.autorizacionesService.rejectAutorizacion(this.selectedSolicitud.id, dto).subscribe({
        next: () => {
          this.solicitudes.update(list => list.filter(s => s.id !== this.selectedSolicitud?.id));
          this.isProcessing = false;
          this.selectedSolicitud = null;
          this.actionType = null;
          this.motivoRechazo = '';
          this.successMessage.set('Solicitud de transferencia rechazada.');
        },
        error: (err) => {
          this.isProcessing = false;
          let msg = err.error?.message || 'Error al rechazar la transferencia.';
          if (err.error?.error?.details?.violations?.length) {
            msg = err.error.error.details.violations[0];
          } else if (Array.isArray(err.error?.message)) {
            msg = err.error.message[0];
          }
          this.errorMessage.set(msg);
        }
      });
    }
  }
}
