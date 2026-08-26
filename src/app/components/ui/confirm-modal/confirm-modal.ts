import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-confirm-modal',
  imports: [ButtonComponent],
  templateUrl: './confirm-modal.html'
})
export class ConfirmModalComponent {
  title = input<string>('¿Estás seguro?');
  message = input<string>('Esta acción no se puede deshacer.');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  variant = input<'primary' | 'error'>('primary');
  isLoading = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();
}
