import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';

interface SolicitudTransferencia {
  id: string;
  cliente: string;
  distribuidoraActual: string;
  distribuidoraNueva: string;
  motivoCliente: string;
  fecha: string;
}

@Component({
  selector: 'app-transferencias',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent],
  templateUrl: './transferencias.html'
})
export class Transferencias {
  solicitudes: SolicitudTransferencia[] = [
    { id: 'TR-1029', cliente: 'Juan Pérez', distribuidoraActual: 'María López', distribuidoraNueva: 'Sandra Castillo', motivoCliente: 'Cambio de domicilio', fecha: '2026-10-14' },
    { id: 'TR-1030', cliente: 'Ana Gómez', distribuidoraActual: 'Carmen Martínez', distribuidoraNueva: 'María López', motivoCliente: 'Mejor trato', fecha: '2026-10-15' }
  ];

  selectedSolicitud: SolicitudTransferencia | null = null;
  actionType: 'approve' | 'reject' | null = null;
  motivoRechazo: string = '';
  isProcessing = false;

  seleccionar(solicitud: SolicitudTransferencia) {
    this.selectedSolicitud = solicitud;
    this.actionType = null;
    this.motivoRechazo = '';
  }

  volverLista() {
    this.selectedSolicitud = null;
    this.actionType = null;
  }

  setAction(type: 'approve' | 'reject' | null) {
    this.actionType = type;
  }

  procesar() {
    this.isProcessing = true;
    
    setTimeout(() => {
      // Quitar de la lista
      this.solicitudes = this.solicitudes.filter(s => s.id !== this.selectedSolicitud?.id);
      
      this.isProcessing = false;
      this.selectedSolicitud = null;
      this.actionType = null;
      this.motivoRechazo = '';
    }, 1500);
  }
}
