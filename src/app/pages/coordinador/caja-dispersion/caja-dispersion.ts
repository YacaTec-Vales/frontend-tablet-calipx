import { Component, signal } from '@angular/core';
import { DiscreteAmountComponent } from '../../../components/ui/discrete-amount/discrete-amount';
import { ButtonComponent } from '../../../components/ui/button/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-caja-dispersion',
  standalone: true,
  imports: [DiscreteAmountComponent, ButtonComponent, FormsModule],
  templateUrl: './caja-dispersion.html',
  styleUrl: './caja-dispersion.css',
})
export class CajaDispersion {
  autorizacion = signal('');
  isSubmitting = signal(false);

  confirmar() {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      // Logica de confirmacion
    }, 2000);
  }
}
