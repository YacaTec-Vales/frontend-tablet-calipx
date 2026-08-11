import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../components/ui/button/button';

/**
 * Pagina de login para la tablet Calipx.
 *
 * Conecta con POST /auth/login y redirige segun el rol
 * del usuario autenticado (COORDINADOR o VERIFICADOR).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly isLoading = computed(() => this.authService.isLoading());

  onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set('');

    const emailValue = this.email();
    const passwordValue = this.password();

    if (!emailValue || !passwordValue) {
      this.error.set('Ingresa tu email y contraseña.');
      return;
    }

    this.authService
      .login({
        usernameOrEmail: emailValue,
        password: passwordValue,
      })
      .subscribe({
        next: () => {
          this.redirectByRole();
        },
        error: (err: HttpErrorResponse) => {
          this.handleLoginError(err);
        },
      });
  }

  /** Redirige segun el rol del usuario autenticado */
  private redirectByRole(): void {
    // Si debe cambiar contrasena, el authGuard lo redirigira
    if (this.authService.mustChangePassword()) {
      this.router.navigate(['/change-password']);
      return;
    }

    const role = this.authService.userRole();

    switch (role) {
      case 'VERIFICADOR':
        this.router.navigate(['/verificador']);
        break;
      case 'COORDINADOR':
        this.router.navigate(['/coordinador']);
        break;
      default:
        this.error.set(`El rol "${role}" no tiene acceso desde esta tablet.`);
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
        this.error.set('Email o contraseña incorrectos.');
        break;
      case 'AUTH.USER_INACTIVE':
        this.error.set('Tu cuenta está desactivada. Contacta al administrador.');
        break;
      case 'AUTH.LOCKED':
        this.error.set('Tu cuenta está bloqueada por demasiados intentos. Intenta más tarde.');
        break;
      case 'AUTH.PASSWORD_NOT_SET':
        this.error.set('Tu cuenta no tiene contraseña configurada. Contacta al administrador.');
        break;
      default:
        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        } else {
          this.error.set(body?.message ?? 'Error inesperado. Intenta de nuevo.');
        }
        break;
    }
  }

  clearError(): void {
    this.error.set('');
  }

  /** Atajos de prueba para desarrollo */
  setTestEmail(email: string): void {
    this.email.set(email);
  }
}
