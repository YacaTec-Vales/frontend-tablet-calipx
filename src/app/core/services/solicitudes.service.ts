import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';
import {
  CreateSolicitudDto,
  UpdateSolicitudDto,
  VerificarSolicitudDto,
  SolicitudResponse,
  EstadoSolicitud,
  DatosGenerales,
  DatosAdicionales
} from '../models/solicitud.model';

/** Filtros opcionales para GET /solicitudes */
export interface SolicitudFilters {
  estado?: EstadoSolicitud;
  page?: number;
  limit?: number;
}

/**
 * Servicio que conecta con los endpoints de solicitudes
 * del modulo Distribuidores.
 *
 * Endpoints 11-16 del documento endpoints_tablet_calipx.md:
 * - POST /solicitudes (Coordinador crea)
 * - PATCH /solicitudes/:id (Coordinador edita)
 * - GET /solicitudes (ambos listan)
 * - GET /solicitudes/:id (ambos ven detalle)
 * - POST /solicitudes/:id/tomar (Verificador toma)
 * - POST /solicitudes/:id/verificar (Verificador dictamina)
 */
@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/solicitudes`;

  /**
   * Mapea un request de frontend al formato camelCase que espera el backend.
   */
  private mapCreateDtoToBackend(dto: CreateSolicitudDto): Record<string, unknown> {
    const branchId = this.authService.currentUser()?.branchId;
    return {
      branchId,
      generalData: dto.datos_generales,
      additionalData: dto.datos_adicionales,
    };
  }

  /**
   * Mapea el response camelCase del backend al modelo snake_case del frontend.
   */
  private mapBackendToResponse(backendObj: Record<string, unknown>): SolicitudResponse {
    return {
      id: backendObj['id'] as string,
      folio: backendObj['folio'] as string | undefined,
      estado: backendObj['status'] as SolicitudResponse['estado'], // status -> estado
      datos_generales: backendObj['generalData'] as DatosGenerales,
      datos_adicionales: backendObj['additionalData'] as DatosAdicionales,
      coordinador_id: backendObj['coordinatorId'] as string,
      verificador_id: backendObj['verifierId'] as string | undefined,
      branch_id: backendObj['branchId'] as string,
      fotos_verificacion: backendObj['verificationPhotos'] as string[] | undefined,
      comentarios_verificador: backendObj['verifierComments'] as string | undefined,
      dictamen: backendObj['verdict'] as SolicitudResponse['dictamen'], // verdict -> dictamen
      kill_switch: backendObj['killSwitch'] as boolean | undefined,
      created_at: backendObj['createdAt'] as string,
      updated_at: backendObj['updatedAt'] as string,
    };
  }

  /**
   * POST /solicitudes
   */
  create(dto: CreateSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    const payload = this.mapCreateDtoToBackend(dto);
    return this.http.post<ApiResponse<Record<string, unknown>>>(this.apiUrl, payload).pipe(
      map(res => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * PATCH /solicitudes/:id
   */
  update(id: string, dto: UpdateSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    const payload: Record<string, unknown> = {};
    if (dto.datos_generales) payload['generalData'] = dto.datos_generales;
    if (dto.datos_adicionales) payload['additionalData'] = dto.datos_adicionales;

    return this.http.patch<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/${id}`, payload).pipe(
      map(res => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * GET /solicitudes
   */
  list(filters?: SolicitudFilters): Observable<ApiResponse<SolicitudResponse[]>> {
    let params = new HttpParams();

    if (filters?.estado) {
      params = params.set('status', filters.estado); // Maps estado to status for query param
    }
    if (filters?.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ApiResponse<Record<string, unknown>[]>>(this.apiUrl, { params }).pipe(
      map(res => ({
        ...res,
        data: (res.data || []).map(item => this.mapBackendToResponse(item))
      }))
    );
  }

  /**
   * GET /solicitudes/:id
   */
  getById(id: string): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.get<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/${id}`).pipe(
      map(res => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * POST /solicitudes/:id/tomar
   */
  tomar(id: string): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.post<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/${id}/tomar`, {}).pipe(
      map(res => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }

  /**
   * POST /solicitudes/:id/verificar
   */
  verificar(id: string, dto: VerificarSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.post<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/${id}/verificar`, dto).pipe(
      map(res => ({
        ...res,
        data: this.mapBackendToResponse(res.data)
      }))
    );
  }
}
