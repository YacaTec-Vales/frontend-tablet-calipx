import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DistribuidorResponse, CreditIncrementRequest, CreateCreditRaiseDto } from '../models/distribuidor.model';

/**
 * Servicio que conecta con los endpoints de distribuidoras
 * ya autorizadas (post-alta).
 *
 * Endpoints 17-18 del documento endpoints_tablet_calipx.md:
 * - GET /distribuidores/:id (detalle de distribuidora)
 * - POST /distribuidores/:id/credit/increment (preautorizar credito)
 */
@Injectable({ providedIn: 'root' })
export class DistribuidoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/distribuidores`;

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
  createCreditRaiseRequest(id: string, dto: CreateCreditRaiseDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/credit-raise-requests`, dto);
  }

  /**
   * GET /distribuidores/:id/credit-raise-requests
   * Lista el historial de peticiones de aumento de credito de una distribuidora.
   */
  getRaiseRequests(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/credit-raise-requests`);
  }
}
