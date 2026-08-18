import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../../core/models/api-response.model';

/**
 * Pagina de cambio de contrasena obligatorio.
 *
 * Se muestra cuando mustChangePassword = true (primer login
 * tras alta administrativa). Conecta con POST /auth/change-password.
 */
@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  template: `
    <section class="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900">Cambiar contraseña</h2>
          <p class="text-gray-500 mt-2">Tu cuenta requiere un cambio de contraseña antes de continuar.</p>
        </div>

        @if (error()) {
          <div class="p-3 text-sm text-red-800 bg-red-50 rounded-lg font-bold" role="alert">
            {{ error() }}
          </div>
        }

        @if (success()) {
          <div class="p-3 text-sm text-green-800 bg-green-50 rounded-lg font-bold" role="alert">
            {{ success() }}
          </div>
        }

        <form class="space-y-4" (ngSubmit)="onSubmit()">
          <div>
            <label for="currentPassword" class="block mb-2 text-sm font-bold text-gray-900">Contraseña actual</label>
            <input
              #currentInput
              type="password"
              id="currentPassword"
              [value]="currentPassword()"
              (input)="currentPassword.set(currentInput.value)"
              class="bg-gray-200 border-0 text-gray-900 text-lg rounded-xl focus:ring-4 focus:ring-brand-300 block w-full p-4 font-semibold"
              required
              [disabled]="isLoading()"
              autocomplete="current-password">
          </div>
          <div>
            <label for="newPassword" class="block mb-2 text-sm font-bold text-gray-900">Nueva contraseña</label>
            <input
              #newInput
              type="password"
              id="newPassword"
              [value]="newPassword()"
              (input)="newPassword.set(newInput.value)"
              class="bg-gray-200 border-0 text-gray-900 text-lg rounded-xl focus:ring-4 focus:ring-brand-300 block w-full p-4 font-semibold"
              required
              [disabled]="isLoading()"
              autocomplete="new-password">
          </div>
          <div>
            <label for="confirmPassword" class="block mb-2 text-sm font-bold text-gray-900">Confirmar nueva contraseña</label>
            <input
              #confirmInput
              type="password"
              id="confirmPassword"
              [value]="confirmPassword()"
              (input)="confirmPassword.set(confirmInput.value)"
              class="bg-gray-200 border-0 text-gray-900 text-lg rounded-xl focus:ring-4 focus:ring-brand-300 block w-full p-4 font-semibold"
              required
              [disabled]="isLoading()"
              autocomplete="new-password">
          </div>
          <button
            type="submit"
            class="w-full text-white font-bold rounded-xl text-xl px-5 py-4 mt-4 shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style="background-color: var(--color-brand);"
            [disabled]="!canSubmit()">
            @if (isLoading()) {
              Cambiando contraseña...
            } @else {
              Cambiar contraseña
            }
          </button>
        </form>
      </div>
    </section>
  `,
})
export class ChangePassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly error = signal('');
  readonly success = signal('');
  readonly isLoading = signal(false);

  readonly canSubmit = computed(() => {
    return (
      this.currentPassword().length > 0 &&
      this.newPassword().length >= 8 &&
      this.newPassword() === this.confirmPassword() &&
      !this.isLoading()
    );
  });

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);

    this.authService
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.success.set('Contraseña cambiada exitosamente. Redirigiendo...');

          setTimeout(() => {
            const role = this.authService.userRole();
            if (role === 'VERIFICADOR') {
              this.router.navigate(['/verificador']);
            } else if (role === 'COORDINADOR') {
              this.router.navigate(['/coordinador']);
            } else {
              this.router.navigate(['/login']);
            }
          }, 1500);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          const body = err.error as ApiErrorResponse | undefined;
          const code = body?.error?.code;

          switch (code) {
            case 'AUTH.INVALID_CREDENTIALS':
              this.error.set('La contraseña actual es incorrecta.');
              break;
            case 'AUTH.WEAK_PASSWORD':
              const reasons = (body?.error?.details as Record<string, string[]>)?.['reasons'] ?? [];
              this.error.set(`La contraseña es débil: ${reasons.join(', ')}`);
              break;
            default:
              this.error.set(body?.message ?? 'Error al cambiar la contraseña.');
              break;
          }
        },
      });
  }
}
