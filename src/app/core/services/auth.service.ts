import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';
import {
  LoginRequest,
  TokenResponse,
  AuthUser,
  RefreshRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserRole,
  LoginResponseDto,
} from '../models/auth.model';

const TOKEN_KEY = 'calipx_access_token';
const REFRESH_KEY = 'calipx_refresh_token';
const USER_KEY = 'calipx_user';

/**
 * Servicio de autenticacion para la tablet Calipx.
 *
 * Gestiona el ciclo completo de JWT: login, refresh, logout,
 * perfil y cambio de contrasena. Expone signals reactivos
 * para que los componentes lean el estado de autenticacion.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  /** Usuario autenticado actual (null si no hay sesion) */
  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());

  private getStoredUser(): AuthUser | null {
    const userStr = sessionStorage.getItem(USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  updateCurrentUser(user: AuthUser): void {
    this.currentUser.set(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /** Indica si hay un usuario autenticado con token valido */
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** Rol del usuario actual */
  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? this.currentUser()?.roleCode ?? null);

  /** Flag que indica si el usuario debe cambiar su contrasena */
  readonly mustChangePassword = computed(() => this.currentUser()?.mustChangePassword ?? false);

  /** Indica si el login esta en curso */
  readonly isLoading = signal(false);

  // ─── Token management ──────────────────────────────────

  /** Obtiene el access token almacenado */
  getAccessToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /** Obtiene el refresh token almacenado */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  private saveSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearTokens(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // ─── Auth endpoints ────────────────────────────────────

  /**
   * POST /auth/login
   * Autentica al usuario y almacena tokens JWT.
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponseDto>> {
    this.isLoading.set(true);

    return this.http
      .post<ApiResponse<LoginResponseDto>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (!response.data.mfaRequired && response.data.accessToken && response.data.refreshToken && response.data.user) {
            this.saveSession(response.data.accessToken, response.data.refreshToken, response.data.user);
            this.currentUser.set(response.data.user);
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * POST /auth/mfa-verify
   * Verifica el codigo TOTP despues de un login exitoso que requeria MFA.
   */
  mfaVerify(mfaToken: string, code: string): Observable<ApiResponse<TokenResponse>> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<TokenResponse>>(
        `${this.apiUrl}/auth/mfa-verify`, 
        { code },
        { headers: { Authorization: `Bearer ${mfaToken}` } }
      )
      .pipe(
        tap((response) => {
          const { accessToken, refreshToken, user } = response.data;
          this.saveSession(accessToken, refreshToken, user);
          this.currentUser.set(user);
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * POST /auth/refresh
   * Rota el refresh token. Deteccion de reuso integrada en el backend.
   */
  refresh(): Observable<ApiResponse<TokenResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    const body: RefreshRequest = { refreshToken };

    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/auth/refresh`, body).pipe(
      tap((response) => {
        const { accessToken, refreshToken: newRefreshToken, user } = response.data;
        this.saveSession(accessToken, newRefreshToken, user);
        this.currentUser.set(user);
      }),
    );
  }

  /**
   * POST /auth/logout
   * Revoca la sesion actual en el backend y limpia el estado local.
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    const token = this.getAccessToken();

    if (!token && !refreshToken) {
      this.clearSession();
      return;
    }

    this.http
      .post(`${this.apiUrl}/auth/logout`, refreshToken ? { refreshToken } : {})
      .pipe(catchError(() => {
        // Incluso si el backend falla, limpiamos el estado local
        this.clearSession();
        return [];
      }))
      .subscribe(() => {
        this.clearSession();
      });
  }

  /**
   * GET /auth/me
   * Revalida el usuario contra BD y actualiza permisos efectivos.
   */
  getMe(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        this.currentUser.set(response.data);
      }),
    );
  }

  /**
   * POST /auth/change-password
   * Cambio de contrasena. Requerido cuando mustChangePassword = true.
   */
  changePassword(dto: ChangePasswordRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiUrl}/auth/change-password`, dto)
      .pipe(
        tap((response) => {
          // El backend devuelve nuevos tokens tras cambiar contrasena
          if (response.data?.accessToken) {
            const currentRefreshToken = this.getRefreshToken();
            const newRefreshToken = response.data.refreshToken || currentRefreshToken || '';
            this.saveSession(response.data.accessToken, newRefreshToken, response.data.user);
            this.currentUser.set(response.data.user);
          }
        }),
      );
  }

  /**
   * POST /auth/forgot-password (publico)
   * Solicita recuperacion de contrasena por email.
   */
  forgotPassword(dto: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/forgot-password`, dto);
  }

  /**
   * POST /auth/reset-password (publico)
   * Resetea contrasena con token recibido por email.
   */
  resetPassword(dto: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/reset-password`, dto);
  }

  // ─── Utilidades ────────────────────────────────────────

  /**
   * Intenta restaurar la sesion desde el token almacenado.
   * Se llama al iniciar la app para mantener la sesion activa.
   */
  tryRestoreSession(): void {
    const token = this.getAccessToken();
    if (!token) return;

    this.getMe().pipe(
      catchError(() => {
        this.clearSession();
        return [];
      }),
    ).subscribe();
  }

  /** Limpia tokens y estado de usuario, redirige al login */
  private clearSession(): void {
    this.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
