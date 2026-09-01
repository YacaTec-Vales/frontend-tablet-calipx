import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  listarDistribuidoras(id: string, params?: { status?: string, search?: string, page?: number, limit?: number, sortOrder?: string }): Observable<ApiResponse<PaginatedDistribuidoresResponse>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    return this.http.get<ApiResponse<PaginatedDistribuidoresResponse>>(`${this.apiUrl}/${id}/distribuidoras`, { params: httpParams });
  }
}
