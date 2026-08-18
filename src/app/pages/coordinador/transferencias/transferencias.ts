import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { AutorizacionesService, AuthorizationResponseDto } from '../../../core/services/autorizaciones.service';
import { CoordinadoresService } from '../../../core/services/coordinadores.service';
import { AuthService } from '../../../core/services/auth.service';
import { DistribuidorResponse } from '../../../core/models/distribuidor.model';

/** Tipo extendido con nombres resueltos para la vista */
interface TransferenciaView extends AuthorizationResponseDto {
  clienteNombre: string;
  distribuidoraOrigenNombre: string;
  distribuidoraDestinoNombre: string;
}

@Component({
  selector: 'app-transferencias',
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent],
  templateUrl: './transferencias.html'
})
export class Transferencias implements OnInit, OnDestroy {
  private autorizacionesService = inject(AutorizacionesService);
  private coordinadoresService = inject(CoordinadoresService);
  private authService = inject(AuthService);

  solicitudes = signal<TransferenciaView[]>([]);
  distribuidorasAsignables = signal<DistribuidorResponse[]>([]);
  isLoading = signal(true);

  selectedSolicitud: TransferenciaView | null = null;
  actionType: 'approve' | 'reject' | null = null;
  motivoRechazo: string = '';
  selectedDistributorId: string = '';
  isProcessing = false;

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit() {
    this.cargarSolicitudes();
    this.cargarDistribuidoras();
  }

  cargarDistribuidoras() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.coordinadoresService.listarDistribuidoras(user.id).subscribe({
      next: (res) => this.distribuidorasAsignables.set(res.data?.data || [])
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  cargarSolicitudes(isBackground = false) {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    if (!isBackground) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }
    this.autorizacionesService.getAutorizaciones().subscribe({
      next: (res) => {
        const pendientes = (res.data || []).filter(
          a => a.authorizationType === 'TRANSFERENCIA_DISTRIBUIDOR' && (a.status === 'PENDING' || a.status === 'PENDIENTE')
        );

        if (pendientes.length === 0) {
          this.solicitudes.set([]);
          this.isLoading.set(false);
          return;
        }

        this.construirVista(pendientes, isBackground);
      },
      error: () => {
        if (!isBackground) {
          this.isLoading.set(false);
          this.errorMessage.set('Error al cargar las solicitudes de transferencia.');
        }
        this.scheduleNextPoll();
      }
    });
  }

  private scheduleNextPoll() {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.cargarSolicitudes(true);
    }, 15000);
  }

  private construirVista(pendientes: AuthorizationResponseDto[], isBackground = false) {
    const vista: TransferenciaView[] = pendientes.map(p => ({
      ...p,
      clienteNombre: p.resolvedNames?.clientName || 'Cliente Desconocido',
      distribuidoraOrigenNombre: p.resolvedNames?.fromDistributorName || 'Desconocido',
      distribuidoraDestinoNombre: p.resolvedNames?.toDistributorName || 'Desconocido',
    }));
    this.solicitudes.set(vista);
    if (!isBackground) this.isLoading.set(false);
    this.scheduleNextPoll();
  }

  getClienteNombre(solicitud: TransferenciaView): string {
    return solicitud.clienteNombre;
  }

  getDistribuidoraOrigen(solicitud: TransferenciaView): string {
    return solicitud.distribuidoraOrigenNombre;
  }


  seleccionar(solicitud: TransferenciaView) {
    this.selectedSolicitud = solicitud;
    this.actionType = null;
    this.motivoRechazo = '';
    this.selectedDistributorId = '';
  }

  volverLista() {
    this.selectedSolicitud = null;
    this.actionType = null;
    this.selectedDistributorId = '';
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
      if (!this.selectedDistributorId) {
        this.errorMessage.set('Debes seleccionar una distribuidora destino.');
        this.isProcessing = false;
        return;
      }

      const dto = {
        notes: 'Aprobado y asignado por coordinador',
        newDistributorId: this.selectedDistributorId
      };

      this.autorizacionesService.approveAutorizacion(this.selectedSolicitud.id, dto).subscribe({
        next: () => {
          this.solicitudes.update(list => list.filter(s => s.id !== this.selectedSolicitud?.id));
          this.isProcessing = false;
          this.selectedSolicitud = null;
          this.actionType = null;
          this.selectedDistributorId = '';
          this.successMessage.set('Transferencia aprobada y asignada correctamente.');
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

