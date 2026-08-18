import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { TransferClientDto, ClientTransferResponse } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/clients`;

  transferDistributor(id: string, dto: TransferClientDto): Observable<ApiResponse<ClientTransferResponse>> {
    return this.http.post<ApiResponse<ClientTransferResponse>>(`${this.apiUrl}/${id}/transfer-distributor`, dto);
  }
}
