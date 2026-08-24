import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';

/**
 * Documento del modulo `app.document`.
 *
 * Entidad unica para todos los GETs del backend (`/uploads/:id`,
 * `/uploads/client/:clientId`, etc). La `publicUrl` viene firmada
 * SigV4 con TTL de 15 min; si expira, el frontend debe re-fetchear
 * el documento por su `id` para obtener una URL fresca.
 */
export interface DocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string | null;
  uploadedBy: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

/**
 * Tipos de documento conocidos. El backend acepta cualquier string
 * (`other` es la opcion generica), pero estos son los que la UI usa.
 */
export type KnownDocumentType =
  | 'ine'
  | 'address_proof'
  | 'voucher_evidence'
  | 'conciliacion_evidence'
  | 'photo_verification'
  | 'other'
  | string;

/**
 * Servicio de uploads/documentos para el frontend Calipx.
 *
 * Endpoints consumidos (prefijo `${apiUrl}/uploads`):
 *  - POST /                          subir archivo generico
 *  - POST /verification/:solicitanteId  subir foto de verificacion
 *  - GET  /:id                       metadata + URL firmada
 *  - GET  /client/:clientId          documentos del cliente
 *  - GET  /verification/:solicitanteId  documentos de una verificacion
 *  - GET  /type/:documentType        documentos por tipo
 *
 * Ver `docs/uploads-api-frontends.md` en el backend para el contrato
 * completo y el manejo de URLs expiradas.
 */
@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/uploads`;

  /**
   * Sube un archivo al backend (multipart/form-data).
   * Devuelve el `DocumentResponse` con `id` y `publicUrl` fresca (15 min).
   */
  uploadFile(file: File, documentType: KnownDocumentType): Observable<ApiResponse<DocumentResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return this.http.post<ApiResponse<DocumentResponse>>(this.apiUrl, formData);
  }

  /**
   * Sube una foto de verificacion asociada a una solicitud. El backend
   * inyecta `metadata.solicitationId` automaticamente para que
   * `getDocumentsByVerification()` la encuentre.
   */
  uploadForVerification(
    solicitationId: string,
    file: File,
    documentType: KnownDocumentType,
  ): Observable<ApiResponse<DocumentResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return this.http.post<ApiResponse<DocumentResponse>>(
      `${this.apiUrl}/verification/${solicitationId}`,
      formData,
    );
  }

  /** GET /uploads/:id -> DocumentResponse */
  getById(id: string): Observable<DocumentResponse> {
    return this.http
      .get<ApiResponse<DocumentResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /** GET /uploads/verification/:solicitationId */
  getDocumentsByVerification(solicitationId: string): Observable<DocumentResponse[]> {
    return this.http
      .get<ApiResponse<DocumentResponse[]>>(`${this.apiUrl}/verification/${solicitationId}`)
      .pipe(map((res) => res.data ?? []));
  }

  /** GET /uploads/client/:clientId */
  getDocumentsByClient(clientId: string): Observable<DocumentResponse[]> {
    return this.http
      .get<ApiResponse<DocumentResponse[]>>(`${this.apiUrl}/client/${clientId}`)
      .pipe(map((res) => res.data ?? []));
  }

  /** GET /uploads/type/:documentType */
  getDocumentsByType(documentType: KnownDocumentType): Observable<DocumentResponse[]> {
    return this.http
      .get<ApiResponse<DocumentResponse[]>>(`${this.apiUrl}/type/${documentType}`)
      .pipe(map((res) => res.data ?? []));
  }

  isImage(mime: string): boolean {
    return mime?.startsWith('image/');
  }

  isPdf(mime: string): boolean {
    return mime === 'application/pdf';
  }
}