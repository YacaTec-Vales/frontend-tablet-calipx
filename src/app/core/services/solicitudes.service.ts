import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateSolicitudDto,
  UpdateSolicitudDto,
  VerificarSolicitudDto,
  SolicitudResponse,
  EstadoSolicitud,
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
  private readonly apiUrl = `${environment.apiUrl}/solicitudes`;

  /**
   * POST /solicitudes
   * El Coordinador crea una nueva solicitud con datos_generales
   * y datos_adicionales. Nace en estado EN_VERIFICACION.
   */
  create(dto: CreateSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.post<ApiResponse<SolicitudResponse>>(this.apiUrl, dto);
  }

  /**
   * PATCH /solicitudes/:id
   * El Coordinador edita una solicitud existente.
   * - Antes del verificador: edicion libre.
   * - Tras dictamen NO_CUMPLE: 1ra edicion libre, 2da+ requiere auth del Gerente.
   * - Tras editar, vuelve a EN_VERIFICACION.
   */
  update(id: string, dto: UpdateSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.patch<ApiResponse<SolicitudResponse>>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * GET /solicitudes
   * Lista solicitudes filtradas por sucursal y permisos del actor.
   */
  list(filters?: SolicitudFilters): Observable<ApiResponse<SolicitudResponse[]>> {
    let params = new HttpParams();

    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters?.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ApiResponse<SolicitudResponse[]>>(this.apiUrl, { params });
  }

  /**
   * GET /solicitudes/:id
   * Detalle completo de una solicitud: datos del coordinador,
   * datos del verificador, dictamen y estado.
   */
  getById(id: string): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.get<ApiResponse<SolicitudResponse>>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /solicitudes/:id/tomar
   * El Verificador se asigna la solicitud para ir al domicilio.
   * Solo funciona si la solicitud esta en EN_VERIFICACION.
   */
  tomar(id: string): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.post<ApiResponse<SolicitudResponse>>(`${this.apiUrl}/${id}/tomar`, {});
  }

  /**
   * POST /solicitudes/:id/verificar
   * El Verificador envia su dictamen con fotos, comentarios
   * y kill_switch. Cambia estado segun reglas del dictamen.
   */
  verificar(id: string, dto: VerificarSolicitudDto): Observable<ApiResponse<SolicitudResponse>> {
    return this.http.post<ApiResponse<SolicitudResponse>>(`${this.apiUrl}/${id}/verificar`, dto);
  }
}
