import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { HealthResponse } from '../models/api-response.model';

/**
 * Servicio de health checks para verificar conectividad con el backend.
 *
 * Endpoints 22-23 del documento endpoints_tablet_Calipx.md:
 * - GET /health/live (liveness)
 * - GET /health/ready (readiness)
 *
 * NOTA: Estos endpoints devuelven formato Terminus, NO el envelope estandar.
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/health`;

  /** GET /health/live — 200 si Node esta vivo */
  live(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/live`);
  }

  /** GET /health/ready — 200 si BD responde; 503 si falla */
  ready(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/ready`);
  }
}
