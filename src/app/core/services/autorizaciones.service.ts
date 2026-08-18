import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AuthorizationResponseDto {
  id: string;
  authorizationType: 'TRANSFERENCIA_DISTRIBUIDOR' | 'MODIFICACION_CLIENTE' | 'INCREMENTO_CREDITO' | 'CONCILIACION_MANUAL';
  requesterId: string;
  authorizerId: string | null;
  affectedEntity: unknown; // JSON dinámico con los datos de la transferencia
  resolvedNames?: {
    clientName: string;
    fromDistributorName: string;
    toDistributorName: string;
  };
  justification: string;
  status: 'PENDING' | 'PENDIENTE' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  metadata: unknown | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ApproveAuthorizationDto {
  notes?: string;
  newDistributorId?: string;
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

  private mapBackendToResponse(data: unknown): AuthorizationResponseDto {
    return data as AuthorizationResponseDto;
  }

  /**
   * POST /api/v1/autorizaciones/{id}/aprobar
   * Aprueba una autorización.
   */
  approveAutorizacion(id: string, payload: { notes?: string }): Observable<ApiResponse<AuthorizationResponseDto>> {
    return this.http.post<ApiResponse<AuthorizationResponseDto>>(`${this.apiUrl}/${id}/aprobar`, payload).pipe(
      map((res) => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * POST /autorizaciones/:id/aceptar-destino
   */
  acceptDestinationAutorizacion(id: string, payload: { notes?: string }): Observable<ApiResponse<AuthorizationResponseDto>> {
    return this.http.post<ApiResponse<AuthorizationResponseDto>>(`${this.apiUrl}/${id}/aceptar-destino`, payload).pipe(
      map((res) => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * POST /api/v1/autorizaciones/{id}/rechazar
   * Rechaza una autorización.
   */
  rejectAutorizacion(id: string, dto: RejectAuthorizationDto): Observable<ApiResponse<AuthorizationResponseDto>> {
    return this.http.post<ApiResponse<AuthorizationResponseDto>>(`${this.apiUrl}/${id}/rechazar`, dto);
  }
}
