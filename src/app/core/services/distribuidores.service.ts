import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DistribuidorResponse, CreditIncrementRequest, CreateCreditRaiseDto, CreditRaiseRequest } from '../models/distribuidor.model';

export interface PaginatedDistribuidoresResponse {
  data: DistribuidorResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Servicio que conecta con los endpoints de distribuidoras
 * ya autorizadas (post-alta).
 *
 * Endpoints 17-18 del documento endpoints_tablet_Calipx.md:
 * - GET /distribuidores/:id (detalle de distribuidora)
 * - POST /distribuidores/:id/credit/increment (preautorizar credito)
 */
@Injectable({ providedIn: 'root' })
export class DistribuidoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/distribuidores`;

  /**
   * GET /distribuidores
   * Lista paginada de distribuidoras con scope de sucursal.
   */
  list(params: { status?: string, search?: string, page?: number, limit?: number, sortOrder?: string }): Observable<ApiResponse<PaginatedDistribuidoresResponse>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<ApiResponse<PaginatedDistribuidoresResponse>>(this.apiUrl, { params: httpParams });
  }

  /**
   * GET /distribuidores/:id
   * Detalle de una distribuidora ya autorizada.
   */
  getById(id: string): Observable<ApiResponse<DistribuidorResponse>> {
    return this.http.get<ApiResponse<DistribuidorResponse>>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /distribuidores/:id/credit/increment
   * El Coordinador preautoriza un incremento de linea de credito.
   * El Gerente aprueba o ajusta desde desktop.
   */
  incrementCredit(id: string, dto: CreditIncrementRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/credit/increment`, dto);
  }

  /**
   * POST /distribuidores/:id/credit-raise-requests
   * El Coordinador solicita un aumento de linea de credito que requiere aprobacion gerencial.
   */
  createCreditRaiseRequest(id: string, dto: CreateCreditRaiseDto): Observable<ApiResponse<CreditRaiseRequest>> {
    return this.http.post<ApiResponse<CreditRaiseRequest>>(`${this.apiUrl}/${id}/credit-raise-requests`, dto);
  }

  /**
   * GET /distribuidores/:id/credit-raise-requests
   * Lista el historial de peticiones de aumento de credito de una distribuidora.
   */
  getRaiseRequests(id: string): Observable<ApiResponse<CreditRaiseRequest[]>> {
    return this.http.get<ApiResponse<CreditRaiseRequest[]>>(`${this.apiUrl}/${id}/credit-raise-requests`);
  }
}
