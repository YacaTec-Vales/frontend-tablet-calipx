import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';

interface Distribuidora {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: 'Activa' | 'Inactiva';
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, ButtonComponent, CardComponent, TableComponent, BadgeComponent],
  templateUrl: './auditoria.html'
})
export class Auditoria {
  distribuidoras: Distribuidora[] = [
    { id: 'DIST-001', nombre: 'María López', telefono: '5551234567', correo: 'maria@ejemplo.com', direccion: 'Calle Roma 123, Centro', estado: 'Activa' },
    { id: 'DIST-002', nombre: 'Carmen Martínez', telefono: '5559876543', correo: 'carmen@ejemplo.com', direccion: 'Av. Las Palmas 45, Sur', estado: 'Activa' },
    { id: 'DIST-003', nombre: 'Lucía Torres', telefono: '5557778888', correo: 'lucia@ejemplo.com', direccion: 'Blvd. Independencia 99', estado: 'Inactiva' }
  ];

  selectedDistribuidora: Distribuidora | null = null;
  formData: any = {};
  originalData: any = {};
  
  showAuditLog = false;
  auditChanges: { field: string, old: string, new: string }[] = [];
  isSubmitting = false;

  seleccionar(dist: Distribuidora) {
    this.selectedDistribuidora = dist;
    // Copiamos los datos para edición
    this.formData = { ...dist };
    this.originalData = { ...dist };
    this.showAuditLog = false;
    this.auditChanges = [];
  }

  volverLista() {
    this.selectedDistribuidora = null;
  }

  revisarCambios() {
    this.auditChanges = [];
    const fields = ['nombre', 'telefono', 'correo', 'direccion'];
    
    fields.forEach(field => {
      if (this.formData[field] !== this.originalData[field]) {
        this.auditChanges.push({
          field: field.toUpperCase(),
          old: this.originalData[field],
          new: this.formData[field]
        });
      }
    });

    if (this.auditChanges.length > 0) {
      this.showAuditLog = true;
    } else {
      alert("No hay cambios que guardar.");
    }
  }

  cancelarGuardado() {
    this.showAuditLog = false;
  }

  confirmarGuardado() {
    this.isSubmitting = true;
    
    setTimeout(() => {
      // Aplicar cambios a la lista principal
      const index = this.distribuidoras.findIndex(d => d.id === this.selectedDistribuidora!.id);
      if (index !== -1) {
        this.distribuidoras[index] = { ...this.formData };
      }
      
      this.isSubmitting = false;
      this.showAuditLog = false;
      this.selectedDistribuidora = null; // Vuelve a la lista
      
      // Simulando registro de log de auditoría en backend
      console.log('--- LOG DE AUDITORÍA CREADO ---');
      console.log('Cambios:', this.auditChanges);
    }, 1500);
  }
}
