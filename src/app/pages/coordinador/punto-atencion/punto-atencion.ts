import { Component, signal } from '@angular/core';
import { DiscreteAmountComponent } from '../../../components/ui/discrete-amount/discrete-amount';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-punto-atencion',
  standalone: true,
  imports: [DiscreteAmountComponent, ButtonComponent],
  templateUrl: './punto-atencion.html',
  styleUrl: './punto-atencion.css',
})
export class PuntoAtencion {
  isSearching = signal(false);
  isConfirming = signal(false);

  buscar() {
    this.isSearching.set(true);
    setTimeout(() => this.isSearching.set(false), 1500);
  }

  confirmar() {
    this.isConfirming.set(true);
    setTimeout(() => this.isConfirming.set(false), 2000);
  }
}
