import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../components/ui/button/button';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse } from '../../../core/models/solicitud.model';
import { CardComponent } from '../../../components/ui/card/card';
import {
  UploadsService,
  type DocumentResponse,
} from '../../../core/services/uploads.service';

@Component({
  selector: 'app-detalle-solicitud',
  imports: [CommonModule, ButtonComponent, CardComponent],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.css'
})
export class DetalleSolicitud implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly solicitudesService = inject(SolicitudesService);
  readonly uploadsService = inject(UploadsService);

  readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly isStarting = signal(false);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  /**
   * Fotos de verificacion ya resueltas a `DocumentResponse` con
   * `publicUrl` fresca. Si una entrada legacy era una URL directa,
   * se envuelve en este tipo para pintarla en el template.
   */
  readonly verificationDocs = signal<DocumentResponse[]>([]);

  ngOnInit() {
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
      }
    });
  }

  /**
   * Resuelve las fotos de verificacion. Estrategia mixta para
   * compatibilidad con datos historicos:
   *  - Llamamos a `GET /uploads/verification/:id` que devuelve todo
   *    lo que tenga `metadata.solicitationId`. Eso cubre el formato
   *    nuevo (UUIDs subidos via /verification/:id).
   *  - Los UUIDs viejos en `verificationPhotos` que NO tengan
   *    metadata.solicitationId (porque se subieron con `POST /uploads`
   *    plano antes de 2026-08-23) se resuelven individualmente con
   *    `GET /uploads/:id`.
   *  - URLs firmadas legacy se renderizan tal cual en el template.
   */
  private loadVerificationPhotos(solicitanteId: string): void {
    this.uploadsService.getDocumentsByVerification(solicitanteId).subscribe({
      next: (byMeta) => {
        const photos = this.solicitud()?.fotos_verificacion ?? [];
        const idsInMeta = new Set(byMeta.map((d) => d.id));
        const legacyUuids = photos.filter(
          (p) => !idsInMeta.has(p),
        );

        if (legacyUuids.length === 0) {
          this.verificationDocs.set(byMeta);
          return;
        }

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

  iniciarValidacion() {
    const s = this.solicitud();
    if (!s) return;

    this.isStarting.set(true);

    // El endpoint /tomar se llama aqui para asignarle la solicitud al verificador
    this.solicitudesService.tomar(s.id).subscribe({
      next: () => {
        this.isStarting.set(false);
        this.router.navigate(['/verificador/formulario-campo', s.id]);
      },
      error: (err) => {
        this.isStarting.set(false);
        const code = err.error?.error?.code;
        if (code === 'DISTRIBUIDORES.NOT_IN_VERIFICATION') {
          this.errorMessage.set('Esta solicitud ya fue tomada o ya no está en verificación.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error al tomar la solicitud');
        }
      }
    });
  }
}
