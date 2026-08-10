import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BusinessConfigItem } from '../models/business-config.model';

/**
 * Servicio para leer la configuracion global del negocio.
 *
 * Endpoint 21 del documento endpoints_tablet_calipx.md:
 * - GET /business-config (lectura de los 7 parametros globales)
 *
 * Solo lectura desde la tablet (PATCH es exclusivo del Gerente General).
 */
@Injectable({ providedIn: 'root' })
export class BusinessConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/business-config`;

  /** GET /business-config — Lista los 7 parametros globales del negocio */
  list(): Observable<ApiResponse<BusinessConfigItem[]>> {
    return this.http.get<ApiResponse<BusinessConfigItem[]>>(this.apiUrl);
  }
}
