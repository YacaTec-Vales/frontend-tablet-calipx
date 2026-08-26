import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';
import { Session } from '../models/session.model';

/**
 * Servicio para gestion de sesiones propias del usuario.
 *
 * Endpoints 8-10 del documento endpoints_tablet_Calipx.md:
 * - GET /auth/sessions (listar sesiones activas)
 * - DELETE /auth/sessions/:id (revocar una sesion)
 * - POST /auth/sessions/revoke-others (revocar todas menos la actual)
 */
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth/sessions`;

  /** GET /auth/sessions — Lista sesiones activas del usuario */
  list(): Observable<ApiResponse<Session[]>> {
    return this.http.get<ApiResponse<Session[]>>(this.apiUrl);
  }

  /** DELETE /auth/sessions/:id — Revoca una sesion propia especifica */
  revoke(sessionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${sessionId}`);
  }

  /** POST /auth/sessions/revoke-others — Revoca todas las sesiones excepto la actual */
  revokeOthers(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/revoke-others`, {});
  }
}
