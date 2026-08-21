import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../components/ui/button/button';
import { InputComponent } from '../../components/ui/input/input';
import { NgOptimizedImage } from '@angular/common';

/**
 * Pagina de login para la tablet Calipx.
 *
 * Conecta con POST /auth/login y redirige segun el rol
 * del usuario autenticado (COORDINADOR o VERIFICADOR).
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonComponent, InputComponent, NgOptimizedImage],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly isLoading = this.authService.isLoading;
  readonly isMfaRequired = signal(false);
  readonly mfaToken = signal('');

  // Login form
  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);

  // MFA form
  readonly mfaCode = signal('');

  readonly alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  onSubmit(event: Event) {
    event.preventDefault();
    this.alert.set(null);

    if (this.isMfaRequired()) {
      // Flujo de MFA Verify
      if (this.mfaCode().length < 6) {
        this.alert.set({
          type: 'error',
          message: 'Ingresa el código de 6 dígitos completo',
        });
        return;
      }

      this.authService.mfaVerify(this.mfaToken(), this.mfaCode()).subscribe({
        next: () => {
          this.alert.set({
            type: 'success',
            message: 'Inicio de sesión exitoso',
          });
          const user = this.authService.currentUser();
          this.redirectUser(user?.role);
        },
        error: (err) => {
          this.alert.set({
            type: 'error',
            message: err.error?.message || 'Código incorrecto. Intenta nuevamente.',
          });
          this.mfaCode.set('');
        },
      });
      return;
    }

    // Flujo normal de Login
    if (!this.email() || !this.password()) {
      this.alert.set({
        type: 'error',
        message: 'Por favor completa todos los campos',
      });
      return;
    }

    this.authService
      .login({
        usernameOrEmail: this.email(),
        password: this.password(),
        rememberMe: true,
      })
      .subscribe({
        next: (response) => {
          if (response.data.mfaRequired && response.data.mfaToken) {
            this.isMfaRequired.set(true);
            this.mfaToken.set(response.data.mfaToken);
            this.alert.set(null);
            return;
          }

          this.alert.set({
            type: 'success',
            message: 'Inicio de sesión exitoso',
          });
          const user = this.authService.currentUser();
          this.redirectUser(user?.role);
        },
        error: (err: HttpErrorResponse) => {
          this.handleLoginError(err);
        },
      });
  }

  /** Redirige segun el rol del usuario autenticado */
  private redirectUser(role: string | undefined | null): void {
    // Si debe cambiar contrasena, el authGuard lo redirigira
    if (this.authService.mustChangePassword()) {
      this.router.navigate(['/change-password']);
      return;
    }

    const effectiveRole = role || this.authService.userRole();

    switch (effectiveRole) {
      case 'VERIFICADOR':
        this.router.navigate(['/verificador']);
        break;
      case 'COORDINADOR':
        this.router.navigate(['/coordinador']);
        break;
      default:
        this.alert.set({ type: 'error', message: `El rol "${effectiveRole}" no tiene acceso desde esta tablet.` });
        this.authService.logout();
        break;
    }
  }

  /** Traduce errores del backend a mensajes legibles en espanol */
  private handleLoginError(err: HttpErrorResponse): void {
    const body = err.error as ApiErrorResponse | undefined;
    const code = body?.error?.code;

    switch (code) {
      case 'AUTH.INVALID_CREDENTIALS':
        this.alert.set({ type: 'error', message: 'Email o contraseña incorrectos.' });
        break;
      case 'AUTH.USER_INACTIVE':
        this.alert.set({ type: 'error', message: 'Tu cuenta está desactivada. Contacta al administrador.' });
        break;
      case 'AUTH.LOCKED':
        this.alert.set({ type: 'error', message: 'Tu cuenta está bloqueada por demasiados intentos. Intenta más tarde.' });
        break;
      case 'AUTH.PASSWORD_NOT_SET':
        this.alert.set({ type: 'error', message: 'Tu cuenta no tiene contraseña configurada. Contacta al administrador.' });
        break;
      default:
        if (err.status === 0) {
          this.alert.set({ type: 'error', message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' });
        } else {
          this.alert.set({ type: 'error', message: body?.message ?? 'Error inesperado. Intenta de nuevo.' });
        }
        break;
    }
  }

  clearError(): void {
    this.alert.set(null);
  }

  /** Atajos de prueba para desarrollo */
  setTestEmail(email: string): void {
    this.email.set(email);
  }
}
