import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DistribuidorResponse } from '../models/distribuidor.model';

export interface PaginatedDistribuidoresResponse {
  data: DistribuidorResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoordinadoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/coordinadores`;

  listarDistribuidoras(id: string): Observable<ApiResponse<PaginatedDistribuidoresResponse>> {
    return this.http.get<ApiResponse<PaginatedDistribuidoresResponse>>(`${this.apiUrl}/${id}/distribuidoras`);
  }
}
