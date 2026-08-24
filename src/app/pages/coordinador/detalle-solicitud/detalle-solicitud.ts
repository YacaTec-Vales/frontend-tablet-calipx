import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse } from '../../../core/models/solicitud.model';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import {
  UploadsService,
  type DocumentResponse,
} from '../../../core/services/uploads.service';

@Component({
  selector: 'app-detalle-solicitud-coordinador',
  imports: [CommonModule, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './detalle-solicitud.html',
})
export class DetalleSolicitud implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly uploadsService = inject(UploadsService);

  readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly verificationDocs = signal<DocumentResponse[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSolicitud(id);
    } else {
      this.errorMessage.set('ID de solicitud no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadSolicitud(id: string): void {
    this.solicitudesService.getById(id).subscribe({
      next: (res) => {
        this.solicitud.set(res.data);
        this.isLoading.set(false);
        this.loadVerificationPhotos(id);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar la solicitud');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Resuelve las fotos de verificacion. Mezcla tres fuentes para
   * compatibilidad con datos historicos:
   *  - `GET /uploads/verification/:id` -> nuevos uploads con metadata
   *  - UUIDs viejos en `fotos_verificacion` que no aparecen ahi
   *    (subidos antes del fix via POST /uploads plano) -> resolver
   *    con `GET /uploads/:id`
   *  - URLs firmadas legacy -> pintar tal cual
   */
  private loadVerificationPhotos(solicitanteId: string): void {
    this.uploadsService.getDocumentsByVerification(solicitanteId).subscribe({
      next: (byMeta) => {
        const photos = this.solicitud()?.fotos_verificacion ?? [];
        const idsInMeta = new Set(byMeta.map((d) => d.id));
        const legacyUuids = photos.filter((p) => !idsInMeta.has(p));
        const urlEntries = photos
          .filter((p) => !/^[0-9a-f]{8}-/i.test(p))
          .map<DocumentResponse>((url) => ({
            id: url,
            documentType: 'photo_verification',
            fileName: 'Foto',
            storagePath: url,
            publicUrl: url,
            mimeType: 'image/jpeg',
            sizeBytes: 0,
            sha256Hash: null,
            uploadedBy: '',
            metadata: {},
            isActive: true,
            createdAt: '',
          }));

        if (legacyUuids.length === 0) {
          this.verificationDocs.set([...byMeta, ...urlEntries]);
          return;
        }

        Promise.all(
          legacyUuids.map(
            (uuid) =>
              new Promise<DocumentResponse | null>((resolve) => {
                this.uploadsService.getById(uuid).subscribe({
                  next: (doc) => resolve(doc),
                  error: () => resolve(null),
                });
              }),
          ),
        ).then((resolved) => {
          this.verificationDocs.set([
            ...byMeta,
            ...urlEntries,
            ...resolved.filter((d): d is DocumentResponse => d !== null),
          ]);
        });
      },
      error: () => {
        this.verificationDocs.set([]);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/coordinador/bandeja']);
  }

  editar(): void {
    const s = this.solicitud();
    if (s) {
      this.router.navigate(['/coordinador/solicitud', s.id, 'editar']);
    }
  }

  formatEstado(estado: string): string {
    const map: Record<string, string> = {
      PRE_SOLICITUD: 'Pre-Solicitud',
      EN_VERIFICACION: 'En Verificación',
      DICTAMINADA: 'Dictaminada',
      AUTORIZADA: 'Autorizada',
      RECHAZADA: 'Rechazada',
    };
    return map[estado] || estado;
  }

  getBadgeVariant(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'EN_VERIFICACION':
        return 'info';
      case 'DICTAMINADA':
        return 'warning';
      case 'AUTORIZADA':
        return 'success';
      case 'RECHAZADA':
        return 'error';
      default:
        return 'info';
    }
  }
}
