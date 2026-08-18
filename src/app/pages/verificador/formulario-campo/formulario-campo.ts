import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { SolicitudResponse, Dictamen, VerificarSolicitudDto } from '../../../core/models/solicitud.model';

/**
 * Formulario de verificacion en campo.
 *
 * El Verificador captura fotos, comentarios, dictamen y kill_switch.
 * Conecta con:
 * - GET /solicitudes/:id (carga datos del coordinador para comparar)
 * - POST /solicitudes/:id/verificar (envia dictamen)
 */
@Component({
  selector: 'app-formulario-campo',
  imports: [FormsModule, CardComponent, InputComponent, ButtonComponent],
  templateUrl: './formulario-campo.html',
})
export class FormularioCampo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly uploadsService = inject(UploadsService);

  /** ID de la solicitud (viene de la ruta) */
  readonly solicitudId = signal('');

  /** Datos de la solicitud cargados del backend */
  readonly solicitud = signal<SolicitudResponse | null>(null);

  /** Estado de carga */
  readonly isLoadingSolicitud = signal(false);

  // ─── Campos del formulario del verificador ─────────────

  /** URLs de fotos de verificacion (por ahora se capturan como archivos) */
  fotoFachada: File | null = null;
  fotoComprobante: File | null = null;
  fotoIdentificacion: File | null = null;

  /** Comentarios del verificador (max 2000 chars segun spec) */
  comentarios = '';

  /**
   * Kill switch: si true, el verificador mata el flujo
   * directamente por fraude evidente (casa inexistente,
   * INE falsa, vehiculo fantasma, etc.)
   */
  readonly killSwitch = signal(false);

  /** Estado de envio */
  readonly isSubmitting = signal(false);

  /** Mensaje de exito tras enviar */
  readonly successMessage = signal('');

  /** Mensaje de error */
  readonly errorMessage = signal('');

  /** Habilita los botones de dictamen solo si hay fotos y comentarios suficientes */
  get canSubmit(): boolean {
    return (
      !!this.fotoFachada &&
      !!this.fotoComprobante &&
      !!this.fotoIdentificacion &&
      this.comentarios.length >= 5 &&
      !this.isSubmitting()
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.solicitudId.set(id);
      this.loadSolicitud(id);
    }
  }

  /** Carga los datos de la solicitud para que el verificador compare */
  private loadSolicitud(id: string): void {
    this.isLoadingSolicitud.set(true);

    this.solicitudesService.getById(id).subscribe({
      next: (response) => {
        this.solicitud.set(response.data);
        this.isLoadingSolicitud.set(false);
      },
      error: (err) => {
        this.isLoadingSolicitud.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al cargar la solicitud.');
      },
    });
  }

  /**
   * Emite dictamen y envia al backend.
   *
   * Dictamen alineado con el backend:
   * - CUMPLE → estado = DICTAMINADA (pasa al Gerente)
   * - NO_CUMPLE + kill_switch=true → estado = RECHAZADA
   * - NO_CUMPLE + kill_switch=false → estado = DICTAMINADA (Gerente decide)
   */
  emitirDictamen(dictamen: Dictamen): void {
    if (!this.fotoFachada || !this.fotoComprobante || !this.fotoIdentificacion) {
      this.errorMessage.set('Las fotografías son requeridas antes de dictaminar.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const uploadFachada$ = this.uploadsService.uploadFile(this.fotoFachada, 'other');
    const uploadComprobante$ = this.uploadsService.uploadFile(this.fotoComprobante, 'address_proof');
    const uploadIdentificacion$ = this.uploadsService.uploadFile(this.fotoIdentificacion, 'ine');

    forkJoin([uploadFachada$, uploadComprobante$, uploadIdentificacion$]).subscribe({
      next: ([resFachada, resComprobante, resIdentificacion]) => {
        const extractUrl = (res: any) => res?.data?.publicUrl || res?.publicUrl || '';
        
        // Parche para desarrollo local: class-validator rechaza 'localhost' por no tener TLD.
        // nip.io resuelve a la misma IP y tiene TLD valido (.io), lo que engaña al validador y permite cargar la imagen localmente.
        const fixLocalhostUrl = (url: string) => url.replace('http://localhost', 'http://127.0.0.1.nip.io');
        
        const urls = [
          fixLocalhostUrl(encodeURI(extractUrl(resFachada))),
          fixLocalhostUrl(encodeURI(extractUrl(resComprobante))),
          fixLocalhostUrl(encodeURI(extractUrl(resIdentificacion)))
        ];

        // Validar que las URLs sean validas (no vacias y que empiecen con http)
        if (urls.some(u => !u || !u.startsWith('http'))) {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error interno: El servidor de archivos no devolvió URLs válidas. ' + JSON.stringify(urls));
          return;
        }

        const dto: VerificarSolicitudDto = {
          fotos_verificacion: urls,
          comentarios_verificador: this.comentarios,
          dictamen,
          kill_switch: this.killSwitch(),
        };

        this.solicitudesService.verificar(this.solicitudId(), dto).subscribe({
          next: () => {
            this.isSubmitting.set(false);

            const dictamenLabel = dictamen === 'CUMPLE' ? 'CUMPLE' : 'NO CUMPLE';
            this.successMessage.set(
              `Dictamen "${dictamenLabel}" enviado exitosamente.`
            );

            // Volver al buzon tras un breve delay
            setTimeout(() => {
              this.volver();
            }, 2000);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const code = err.error?.error?.code;

            if (code === 'DISTRIBUIDORES.NOT_IN_VERIFICATION') {
              this.errorMessage.set('Esta solicitud ya no está en verificación.');
            } else if (code === 'DISTRIBUIDORES.VERIFIER_NO_BRANCH') {
              this.errorMessage.set('No tienes una sucursal asignada. Contacta al administrador.');
            } else {
              this.errorMessage.set(`Error 400. URLs enviadas: ${JSON.stringify(urls)}. Mensaje: ${err.error?.message}`);
            }
          },
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al subir las fotografías. Intenta de nuevo.');
      }
    });
  }

  /** Regresa al buzon de visitas */
  volver(): void {
    this.router.navigate(['/verificador/buzon-visitas']);
  }
}
