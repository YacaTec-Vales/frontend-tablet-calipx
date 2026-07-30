import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';

interface Candidata {
  id: string;
  nombre: string;
  limiteActual: number;
  valesPagados: number;
  puntaje: string;
}

@Component({
  selector: 'app-incentivos',
  standalone: true,
  imports: [CommonModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent],
  templateUrl: './incentivos.html'
})
export class Incentivos {
  candidatas: Candidata[] = [
    { id: 'DIST-001', nombre: 'María López', limiteActual: 10000, valesPagados: 45, puntaje: 'Excelente' },
    { id: 'DIST-004', nombre: 'Juana Hernández', limiteActual: 5000, valesPagados: 30, puntaje: 'Bueno' },
    { id: 'DIST-008', nombre: 'Sandra Castillo', limiteActual: 12000, valesPagados: 90, puntaje: 'Excelente' },
  ];

  selectedCandidata: Candidata | null = null;
  isSending = false;
  requestSent = false;

  seleccionar(candidata: Candidata) {
    this.selectedCandidata = candidata;
    this.requestSent = false;
  }

  volverLista() {
    this.selectedCandidata = null;
  }

  preAutorizarAumento() {
    this.isSending = true;
    // Simulamos el envío de la petición al gerente
    setTimeout(() => {
      this.isSending = false;
      this.requestSent = true;
    }, 1500);
  }
}
