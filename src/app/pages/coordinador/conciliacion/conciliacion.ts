import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-conciliacion',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './conciliacion.html',
  styleUrl: './conciliacion.css',
})
export class Conciliacion {
  isAprobando = signal(false);

  aprobar() {
    this.isAprobando.set(true);
    setTimeout(() => this.isAprobando.set(false), 2000);
  }
}
