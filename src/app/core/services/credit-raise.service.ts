import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';
import { CreditRaiseRequest, DecideCreditRaiseDto } from '../models/distribuidor.model';

@Injectable({ providedIn: 'root' })
export class CreditRaiseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/credit-raise-requests`;

  getPendingRequests(): Observable<ApiResponse<CreditRaiseRequest[]>> {
    return this.http.get<ApiResponse<CreditRaiseRequest[]>>(`${this.apiUrl}/pending`).pipe(
      map(res => ({
        ...res,
        data: (res.data as unknown as { data?: CreditRaiseRequest[] })?.data || res.data || []
      }))
    );
  }

  getById(id: string): Observable<ApiResponse<CreditRaiseRequest>> {
    return this.http.get<ApiResponse<CreditRaiseRequest>>(`${this.apiUrl}/${id}`);
  }

  approve(id: string, dto: DecideCreditRaiseDto): Observable<ApiResponse<CreditRaiseRequest>> {
    return this.http.post<ApiResponse<CreditRaiseRequest>>(`${this.apiUrl}/${id}/approve`, dto);
  }

  reject(id: string, dto: DecideCreditRaiseDto): Observable<ApiResponse<CreditRaiseRequest>> {
    return this.http.post<ApiResponse<CreditRaiseRequest>>(`${this.apiUrl}/${id}/reject`, dto);
  }
}
