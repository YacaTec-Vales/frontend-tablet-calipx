import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-formulario-campo',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent],
  templateUrl: './formulario-campo.html'
})
export class FormularioCampo implements OnInit {
  folio: string = '';
  
  // Evidencia
  fotoFachada: File | null = null;
  fotoComprobante: File | null = null;
  fotoIdentificacion: File | null = null;

  // Dictamen
  comentarios: string = '';
  isSubmitting: boolean = false;
  successMessage: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.folio = params['folio'] || 'SIN-FOLIO';
    });
  }

  volver() {
    this.router.navigate(['/verificador/buzon-visitas']);
  }

  get canSubmit(): boolean {
    return !!this.fotoFachada && !!this.fotoComprobante && !!this.fotoIdentificacion && this.comentarios.length > 5;
  }

  emitirDictamen(estado: 'VERIFICADA' | 'RECHAZADA') {
    this.isSubmitting = true;

    setTimeout(() => {
      this.isSubmitting = false;
      this.successMessage = `La solicitud ${this.folio} ha sido dictaminada como ${estado}.`;
      
      setTimeout(() => {
        this.volver();
      }, 2000);
    }, 1500);
  }
}
