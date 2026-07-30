import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';

@Component({
  selector: 'app-reclutamiento',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, ButtonComponent, CardComponent],
  templateUrl: './reclutamiento.html'
})
export class Reclutamiento {
  formData = {
    nombre: '',
    telefono: '',
    correo: '',
    curp: '',
    direccion: '',
    fotoDomicilio: null as File | null
  };

  isSubmitting = false;
  successMessage = '';

  onSubmit() {
    this.isSubmitting = true;
    
    // Simulación de guardado
    setTimeout(() => {
      this.isSubmitting = false;
      this.successMessage = `La pre-solicitud para ${this.formData.nombre} se ha guardado exitosamente.`;
      
      // Limpiar formulario
      this.formData = {
        nombre: '',
        telefono: '',
        correo: '',
        curp: '',
        direccion: '',
        fotoDomicilio: null
      };

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1500);
  }
}
