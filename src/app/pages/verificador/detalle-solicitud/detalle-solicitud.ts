import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.css'
})
export class DetalleSolicitud {
  constructor(private router: Router) {}
  isStarting = signal(false);

  iniciarValidacion() {
    this.isStarting.set(true);
    // Extraer el id de la url actual si fuera dinamico, aqui lo forzamos a 1
    const id = '123e4567-e89b-12d3-a456-426614174000'; // uuid hardcodeado para demo
    setTimeout(() => {
      this.isStarting.set(false);
      this.router.navigate(['/verificador/formulario-campo', id]);
    }, 1000);
  }
}
