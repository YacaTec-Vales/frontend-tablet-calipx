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
import {
  validateEmail,
  validatePassword,
  validatePasswordsMatch,
  validateMfaCode,
} from '../../core/validators/form-validators';

/**
 * Pagina de login para la tablet Calipx.
 *
 * Conecta con POST /auth/login y maneja el flujo completo:
 * Login -> Cambio de Contrasena -> Configuracion MFA -> Redireccion.
 *
 * Validacion: usa `core/validators/form-validators.ts` para reflejar
 * la politica del backend. Los errores se muestran inline bajo cada
 * input con `[isInvalid]` y `[errorMessage]` en `app-input`, mas un
 * alert global para errores de servidor.
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

  /** Habilita mostrar errores por campo (true despues del primer submit). */
  readonly submitted = signal(false);

  // Errores por campo
  readonly emailError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.email()) return 'Ingresa tu correo electronico.';
    return validateEmail(this.email());
  });

  readonly passwordError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.password()) return 'Ingresa tu contrasena.';
    if (this.password().length < 8) {
      return 'La contrasena debe tener al menos 8 caracteres.';
    }
    return '';
  });

  readonly newPasswordError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.newPassword()) return 'Ingresa la nueva contrasena.';
    return validatePassword(this.newPassword());
  });

  readonly confirmPasswordError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.confirmPassword()) return 'Confirma la nueva contrasena.';
    return validatePasswordsMatch(this.newPassword(), this.confirmPassword());
  });

  readonly mfaCodeError = computed(() => {
    if (!this.submitted()) return '';
    return validateMfaCode(this.mfaCode());
  });

  /** Habilita el submit solo si los campos del step son validos. */
  readonly canSubmit = computed(() => {
    const s = this.step();
    if (s === 'login') {
      return !this.emailError() && !this.passwordError() && this.email() && this.password();
    }
    if (s === 'change_password') {
      return (
        !this.newPasswordError() &&
        !this.confirmPasswordError() &&
        this.newPassword().length > 0 &&
        this.confirmPassword().length > 0
      );
    }
    if (s === 'mfa_verify' || s === 'mfa_setup') {
      return !this.mfaCodeError() && this.mfaCode().length > 0;
    }
    return false;
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && this.authService.getAccessToken()) {
      this.evaluateNextStep(user);
    }
  }

  // --- Paso 1: Login ---
  onLoginSubmit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    this.alert.set(null);

    if (this.emailError() || this.passwordError()) {
      return;
    }

    this.authService
      .login({
        usernameOrEmail: this.email().trim(),
        password: this.password(),
        rememberMe: true,
      })
      .subscribe({
        next: (response) => {
          if (response.data.mfaRequired && response.data.mfaToken) {
            this.step.set('mfa_verify');
            this.mfaToken.set(response.data.mfaToken);
            this.submitted.set(false);
            this.alert.set(null);
            return;
          }

          this.alert.set({ type: 'success', message: 'Inicio de sesion exitoso' });
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

  // --- Paso 1.5: Verificacion MFA (si ya estaba activo antes de login) ---
  onMfaVerifySubmit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    this.alert.set(null);

    if (this.mfaCodeError()) {
      return;
    }

    this.authService.mfaVerify(this.mfaToken(), this.mfaCode()).subscribe({
      next: () => {
        this.alert.set({ type: 'success', message: 'Inicio de sesion exitoso' });
        const user = this.authService.currentUser();
        if (user) {
          this.evaluateNextStep(user);
        }
      },
      error: (err) => {
        this.alert.set({ type: 'error', message: err.error?.message || 'Codigo incorrecto. Intenta nuevamente.' });
        this.mfaCode.set('');
        this.submitted.set(false);
      },
    });
  }

  // --- Paso 2: Cambio de Contrasena Obligatorio ---
  onChangePasswordSubmit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    this.alert.set(null);

    if (this.newPasswordError() || this.confirmPasswordError()) {
      return;
    }

    const currentPwd = this.password() || '';

    this.authService.changePassword({
      currentPassword: currentPwd,
      newPassword: this.newPassword(),
    }).subscribe({
      next: () => {
        this.alert.set({ type: 'success', message: 'Contrasena actualizada correctamente.' });
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, mustChangePassword: false };
          this.authService.updateCurrentUser(updatedUser);
          this.evaluateNextStep(updatedUser);
        }
      },
      error: (err) => {
        this.alert.set({ type: 'error', message: err.error?.message || 'Error al cambiar la contrasena' });
      },
    });
  }

  // --- Paso 3: Configuracion MFA ---
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
        this.submitted.set(false);
        this.isMfaLoading.set(false);
      },
      error: () => {
        this.alert.set({ type: 'error', message: 'No se pudo inicializar la configuracion MFA.' });
        this.isMfaLoading.set(false);
      },
    });
  }

  onMfaSetupSubmit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    this.alert.set(null);

    if (this.mfaCodeError()) {
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
        this.alert.set({ type: 'error', message: err.error?.message || 'Codigo incorrecto.' });
        this.isMfaLoading.set(false);
        this.mfaCode.set('');
        this.submitted.set(false);
      },
    });
  }

  // --- Logica Comun ---
  private evaluateNextStep(user: any) {
    if (user.mustChangePassword) {
      this.step.set('change_password');
      this.submitted.set(false);
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
        this.alert.set({ type: 'error', message: 'Email o contrasena incorrectos.' });
        break;
      case 'AUTH.USER_INACTIVE':
        this.alert.set({ type: 'error', message: 'Tu cuenta esta desactivada. Contacta al administrador.' });
        break;
      case 'AUTH.LOCKED':
        this.alert.set({ type: 'error', message: 'Tu cuenta esta bloqueada por demasiados intentos. Intenta mas tarde.' });
        break;
      case 'AUTH.PASSWORD_NOT_SET':
        this.alert.set({ type: 'error', message: 'Tu cuenta no tiene contrasena configurada. Contacta al administrador.' });
        break;
      default:
        if (err.status === 0) {
          this.alert.set({ type: 'error', message: 'No se pudo conectar con el servidor. Verifica tu conexion a internet.' });
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
