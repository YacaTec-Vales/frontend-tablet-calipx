import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface DocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  publicUrl: string;
}

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/uploads`;

  /**
   * Sube un archivo al backend
   * @param file Archivo a subir
   * @param documentType Tipo de documento (ej. 'ine', 'address_proof', 'other')
   */
  uploadFile(file: File, documentType: string): Observable<ApiResponse<DocumentResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return this.http.post<ApiResponse<DocumentResponse>>(this.apiUrl, formData);
  }
}
