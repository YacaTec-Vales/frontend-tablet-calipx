import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { ClientsService } from '../../../core/services/clients.service';
import { inject, signal } from '@angular/core';

interface SolicitudTransferencia {
  id: string; // client id
  cliente: string;
  distribuidoraActual: string;
  distribuidoraNuevaId: string; // the required newDistributorId UUID
  distribuidoraNueva: string;
  motivoCliente: string;
  fecha: string;
}

@Component({
  selector: 'app-transferencias',
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent],
  templateUrl: './transferencias.html'
})
export class Transferencias {
  private clientsService = inject(ClientsService);

  solicitudes: SolicitudTransferencia[] = [
    { id: '11111111-1111-1111-1111-111111111111', cliente: 'Juan Pérez', distribuidoraActual: 'María López', distribuidoraNuevaId: '22222222-2222-2222-2222-222222222222', distribuidoraNueva: 'Sandra Castillo', motivoCliente: 'Cambio de domicilio', fecha: '2026-10-14' },
    { id: '33333333-3333-3333-3333-333333333333', cliente: 'Ana Gómez', distribuidoraActual: 'Carmen Martínez', distribuidoraNuevaId: '44444444-4444-4444-4444-444444444444', distribuidoraNueva: 'María López', motivoCliente: 'Mejor trato', fecha: '2026-10-15' }
  ];

  selectedSolicitud: SolicitudTransferencia | null = null;
  actionType: 'approve' | 'reject' | null = null;
  motivoRechazo: string = '';
  isProcessing = false;
  
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  seleccionar(solicitud: SolicitudTransferencia) {
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
        newDistributorId: this.selectedSolicitud.distribuidoraNuevaId,
        reason: 'Aprobado por coordinador', // Or another input field if needed
        notes: ''
      };

      this.clientsService.transferDistributor(this.selectedSolicitud.id, dto).subscribe({
        next: () => {
          this.solicitudes = this.solicitudes.filter(s => s.id !== this.selectedSolicitud?.id);
          this.isProcessing = false;
          this.selectedSolicitud = null;
          this.actionType = null;
          this.successMessage.set('Cliente transferido correctamente.');
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage.set(err.error?.message || 'Error al transferir al cliente. Es posible que el ID sea inválido (mock).');
        }
      });
    } else {
      // Simulate reject (since no API for rejection is provided)
      setTimeout(() => {
        this.solicitudes = this.solicitudes.filter(s => s.id !== this.selectedSolicitud?.id);
        this.isProcessing = false;
        this.selectedSolicitud = null;
        this.actionType = null;
        this.motivoRechazo = '';
        this.successMessage.set('Solicitud de transferencia rechazada.');
      }, 1000);
    }
  }
}
