import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
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
} from '../models/auth.model';

const TOKEN_KEY = 'calipx_access_token';
const REFRESH_KEY = 'calipx_refresh_token';

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
  readonly currentUser = signal<AuthUser | null>(null);

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
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Obtiene el refresh token almacenado */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  // ─── Auth endpoints ────────────────────────────────────

  /**
   * POST /auth/login
   * Autentica al usuario y almacena tokens JWT.
   */
  login(credentials: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    this.isLoading.set(true);

    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          const { accessToken, refreshToken, user } = response.data;
          this.saveTokens(accessToken, refreshToken);
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
        this.saveTokens(accessToken, newRefreshToken);
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

    this.http
      .post(`${this.apiUrl}/auth/logout`, refreshToken ? { refreshToken } : {})
      .pipe(catchError(() => {
        // Incluso si el backend falla, limpiamos el estado local
        return [];
      }))
      .subscribe(() => {
        this.clearSession();
      });

    // Limpiamos inmediatamente sin esperar al backend
    this.clearSession();
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
            this.saveTokens(response.data.accessToken, response.data.refreshToken);
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
