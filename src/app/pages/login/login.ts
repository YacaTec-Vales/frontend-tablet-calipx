import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MfaService } from '../../core/services/mfa.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../components/ui/button/button';
import { InputComponent } from '../../components/ui/input/input';
import { NgOptimizedImage } from '@angular/common';
import * as QRCode from 'qrcode';

/**
 * Pagina de login para la tablet Calipx.
 *
 * Conecta con POST /auth/login y maneja el flujo completo:
 * Login -> Cambio de Contraseña -> Configuración MFA -> Redirección.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonComponent, InputComponent, NgOptimizedImage],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MfaService);

  readonly isLoading = this.authService.isLoading;
  readonly isMfaLoading = signal(false);

  readonly step = signal<'login' | 'change_password' | 'mfa_verify' | 'mfa_setup'>('login');
  readonly mfaToken = signal('');

  // Login form
  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);

  // Change Password form
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showNewPassword = signal(false);

  // MFA form
  readonly mfaSetupUrl = signal('');
  readonly mfaBackupCodes = signal<string[]>([]);
  readonly mfaCode = signal('');

  readonly alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  ngOnInit() {
    // Si ya hay usuario logueado pero le faltan pasos, retomamos
    const user = this.authService.currentUser();
    if (user && this.authService.getAccessToken()) {
      this.evaluateNextStep(user);
    }
  }

  // --- Paso 1: Login ---
  onLoginSubmit(event: Event) {
    event.preventDefault();
    this.alert.set(null);

    if (!this.email() || !this.password()) {
      this.alert.set({ type: 'error', message: 'Por favor completa todos los campos' });
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
            this.step.set('mfa_verify');
            this.mfaToken.set(response.data.mfaToken);
            this.alert.set(null);
            return;
          }

          this.alert.set({ type: 'success', message: 'Inicio de sesión exitoso' });
          const user = this.authService.currentUser();
          if (user) {
            this.evaluateNextStep(user);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.handleLoginError(err);
        },
      });
  }

  // --- Paso 1.5: Verificación MFA (si ya estaba activo antes de login) ---
  onMfaVerifySubmit(event: Event) {
    event.preventDefault();
    this.alert.set(null);

    if (this.mfaCode().length < 6) {
      this.alert.set({ type: 'error', message: 'Ingresa el código de 6 dígitos completo' });
      return;
    }

    this.authService.mfaVerify(this.mfaToken(), this.mfaCode()).subscribe({
      next: () => {
        this.alert.set({ type: 'success', message: 'Inicio de sesión exitoso' });
        const user = this.authService.currentUser();
        if (user) {
          this.evaluateNextStep(user);
        }
      },
      error: (err) => {
        this.alert.set({ type: 'error', message: err.error?.message || 'Código incorrecto. Intenta nuevamente.' });
        this.mfaCode.set('');
      },
    });
  }

  // --- Paso 2: Cambio de Contraseña Obligatorio ---
  onChangePasswordSubmit(event: Event) {
    event.preventDefault();
    this.alert.set(null);

    if (!this.newPassword() || !this.confirmPassword()) {
      this.alert.set({ type: 'error', message: 'Completa todos los campos.' });
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.alert.set({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    // Se requiere currentPassword en el backend
    const currentPwd = this.password() || '';

    this.authService.changePassword({
      currentPassword: currentPwd,
      newPassword: this.newPassword()
    }).subscribe({
      next: () => {
        this.alert.set({ type: 'success', message: 'Contraseña actualizada correctamente.' });
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, mustChangePassword: false };
          this.authService.updateCurrentUser(updatedUser);
          this.evaluateNextStep(updatedUser);
        }
      },
      error: (err) => {
        this.alert.set({ type: 'error', message: err.error?.message || 'Error al cambiar la contraseña' });
      }
    });
  }

  // --- Paso 3: Configuración MFA ---
  private initMfaSetup() {
    this.isMfaLoading.set(true);
    this.mfaService.setup().subscribe({
      next: async (response) => {
        try {
          const qrDataUrl = await QRCode.toDataURL(response.data.otpauthUrl, { margin: 1, width: 200 });
          this.mfaSetupUrl.set(qrDataUrl);
        } catch (e) {
          this.mfaSetupUrl.set('');
        }
        this.mfaBackupCodes.set(response.data.backupCodes);
        this.step.set('mfa_setup');
        this.isMfaLoading.set(false);
      },
      error: () => {
        this.alert.set({ type: 'error', message: 'No se pudo inicializar la configuración MFA.' });
        this.isMfaLoading.set(false);
      }
    });
  }

  onMfaSetupSubmit(event: Event) {
    event.preventDefault();
    this.alert.set(null);

    if (this.mfaCode().length < 6) {
      this.alert.set({ type: 'error', message: 'Ingresa el código de 6 dígitos completo' });
      return;
    }

    this.isMfaLoading.set(true);
    this.mfaService.verifySetup(this.mfaCode()).subscribe({
      next: () => {
        this.alert.set({ type: 'success', message: 'MFA configurado correctamente' });
        this.isMfaLoading.set(false);
        const user = this.authService.currentUser();
        this.redirectUser(user?.role);
      },
      error: (err) => {
        this.alert.set({ type: 'error', message: err.error?.message || 'Código incorrecto.' });
        this.isMfaLoading.set(false);
      }
    });
  }

  // --- Lógica Común ---
  private evaluateNextStep(user: any) {
    if (user.mustChangePassword) {
      this.step.set('change_password');
    } else if (user.mfaEnabled === false) {
      this.initMfaSetup();
    } else {
      this.redirectUser(user.role);
    }
  }

  /** Redirige segun el rol del usuario autenticado */
  private redirectUser(role: string | undefined | null): void {
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
}
