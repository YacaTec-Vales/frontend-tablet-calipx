import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AuthorizationResponseDto {
  id: string;
  authorizationType: 'TRANSFERENCIA_DISTRIBUIDOR' | 'MODIFICACION_CLIENTE' | 'INCREMENTO_CREDITO' | 'CONCILIACION_MANUAL';
  requesterId: string;
  authorizerId: string | null;
  affectedEntity: any; // JSON dinámico con los datos de la transferencia
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  metadata: any | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ApproveAuthorizationDto {
  notes?: string;
}

export interface RejectAuthorizationDto {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class AutorizacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/autorizaciones`;

  /**
   * GET /api/v1/autorizaciones
   * Lista las autorizaciones pendientes visibles para el actor.
   */
  getAutorizaciones(): Observable<ApiResponse<AuthorizationResponseDto[]>> {
    return this.http.get<ApiResponse<AuthorizationResponseDto[]>>(this.apiUrl);
  }

  /**
   * POST /api/v1/autorizaciones/{id}/aprobar
   * Aprueba una autorización.
   */
  approveAutorizacion(id: string, dto: ApproveAuthorizationDto): Observable<ApiResponse<AuthorizationResponseDto>> {
    return this.http.post<ApiResponse<AuthorizationResponseDto>>(`${this.apiUrl}/${id}/aprobar`, dto);
  }

  /**
   * POST /api/v1/autorizaciones/{id}/rechazar
   * Rechaza una autorización.
   */
  rejectAutorizacion(id: string, dto: RejectAuthorizationDto): Observable<ApiResponse<AuthorizationResponseDto>> {
    return this.http.post<ApiResponse<AuthorizationResponseDto>>(`${this.apiUrl}/${id}/rechazar`, dto);
  }
}
