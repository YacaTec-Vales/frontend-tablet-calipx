import { Component, OnInit, signal, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import {
  UploadsService,
  type DocumentResponse,
} from '../../../core/services/uploads.service';
import {
  SolicitudResponse,
  Dictamen,
  VerificarSolicitudDto,
} from '../../../core/models/solicitud.model';

/**
 * Formulario de verificacion en campo.
 *
 * El Verificador captura fotos, comentarios, dictamen y kill_switch.
 * Conecta con:
 * - GET /solicitudes/:id (carga datos del coordinador para comparar)
 * - POST /uploads/verification/:id (sube cada foto, el backend inyecta
 *   metadata.solicitationId automaticamente)
 * - POST /solicitudes/:id/verificar (envia dictamen con los IDs de
 *   las fotos; reemplaza el envio de URLs firmadas que expiraban)
 */
@Component({
  selector: 'app-formulario-campo',
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent],
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

  readonly currentTab = signal<'GENERALES' | 'DOMICILIO' | 'VEHICULOS' | 'LABORALES' | 'CREDITOS' | 'FAMILIARES'>('GENERALES');

  // ─── Campos del formulario del verificador ─────────────

  /** URLs de fotos de verificacion (por ahora se capturan como archivos) */
  readonly fotoFachada = signal<File | null>(null);
  readonly previewFachada = signal<string | null>(null);

  readonly fotoComprobante = signal<File | null>(null);
  readonly previewComprobante = signal<string | null>(null);

  readonly fotoIdentificacion = signal<File | null>(null);
  readonly previewIdentificacion = signal<string | null>(null);

  /** Comentarios del verificador (max 2000 chars segun spec) */
  comentarios = '';

  /**
   * Rechazo definitivo: si true, el verificador mata el flujo
   * directamente por fraude evidente (casa inexistente,
   * INE falsa, vehiculo fantasma, etc.)
   */
  readonly rechazoDefinitivo = signal(false);

  /** Estado de envio */
  readonly isSubmitting = signal(false);

  /** Mensaje de exito tras enviar */
  readonly successMessage = signal('');

  /** Mensaje de error */
  readonly errorMessage = signal('');

  // ─── Edición de Datos Generales (In-Place) ─────────────
  readonly isEditingGenerales = signal(false);
  readonly isSavingGenerales = signal(false);

  readonly editNombre = signal('');
  readonly editApellidoPaterno = signal('');
  readonly editApellidoMaterno = signal('');
  readonly editRfc = signal('');
  readonly editCurp = signal('');
  readonly editPhone = signal('');
  readonly editCorreo = signal('');
  readonly editCalle = signal('');
  readonly editNumero = signal('');
  readonly editColonia = signal('');
  readonly editCodigoPostal = signal('');

  iniciarEdicionGenerales(): void {
    const s = this.solicitud();
    if (!s) return;
    this.editNombre.set(s.datos_generales.nombre);
    this.editApellidoPaterno.set(s.datos_generales.apellido_paterno);
    this.editApellidoMaterno.set(s.datos_generales.apellido_materno || '');
    this.editRfc.set(s.datos_generales.rfc);
    this.editCurp.set(s.datos_generales.curp || '');
    this.editPhone.set(s.datos_generales.phone || '');
    this.editCorreo.set(s.datos_generales.correo || '');
    this.editCalle.set(s.datos_generales.calle);
    this.editNumero.set(s.datos_generales.numero);
    this.editColonia.set(s.datos_generales.colonia);
    this.editCodigoPostal.set(s.datos_generales.codigo_postal);
    this.isEditingGenerales.set(true);
  }

  cancelarEdicionGenerales(): void {
    this.isEditingGenerales.set(false);
  }

  guardarEdicionGenerales(): void {
    if (this.isSavingGenerales()) return;
    const s = this.solicitud();
    if (!s) return;
    
    this.isSavingGenerales.set(true);
    this.errorMessage.set('');
    
    const datos_generales = {
      ...s.datos_generales,
      nombre: this.editNombre(),
      apellido_paterno: this.editApellidoPaterno(),
      apellido_materno: this.editApellidoMaterno(),
      rfc: this.editRfc(),
      curp: this.editCurp(),
      phone: this.editPhone(),
      correo: this.editCorreo(),
      calle: this.editCalle(),
      numero: this.editNumero(),
      colonia: this.editColonia(),
      codigo_postal: this.editCodigoPostal()
    };

    this.solicitudesService.update(this.solicitudId(), { datos_generales }).subscribe({
      next: (res) => {
        this.solicitud.set(res.data);
        this.isSavingGenerales.set(false);
        this.isEditingGenerales.set(false);
        this.successMessage.set('Datos Generales actualizados correctamente.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.isSavingGenerales.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al actualizar los datos generales.');
      }
    });
  }

  /** Habilita los botones de dictamen solo si hay fotos y comentarios suficientes */
  get canSubmit(): boolean {
    return (
      !!this.fotoFachada() &&
      !!this.fotoComprobante() &&
      !!this.fotoIdentificacion() &&
      this.comentarios.trim().length >= 5 &&
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
   * - NO_CUMPLE + rechazoDefinitivo=true → estado = RECHAZADA
   * - NO_CUMPLE + rechazoDefinitivo=false → estado = DICTAMINADA (Gerente decide)
   */
  emitirDictamen(dictamen: Dictamen): void {
    if (!this.fotoFachada() || !this.fotoComprobante() || !this.fotoIdentificacion()) {
      this.errorMessage.set('Las fotografías son requeridas antes de dictaminar.');
      return;
    }
    if (this.comentarios.trim().length < 5) {
      this.errorMessage.set('Los comentarios son obligatorios (minimo 5 caracteres).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const solicitudId = this.solicitudId();

    const uploadFachada$ = this.uploadsService.uploadForVerification(
      solicitudId,
      this.fotoFachada()!,
      'other',
    );
    const uploadComprobante$ = this.uploadsService.uploadForVerification(
      solicitudId,
      this.fotoComprobante()!,
      'address_proof',
    );
    const uploadIdentificacion$ = this.uploadsService.uploadForVerification(
      solicitudId,
      this.fotoIdentificacion()!,
      'ine',
    );

    forkJoin([uploadFachada$, uploadComprobante$, uploadIdentificacion$]).subscribe({
      next: ([resFachada, resComprobante, resIdentificacion]) => {
        const extractId = (res: unknown): string | null => {
          const r = res as { data?: { id?: string }; id?: string };
          return r?.data?.id ?? r?.id ?? null;
        };

        const fachadaId = extractId(resFachada);
        const comprobanteId = extractId(resComprobante);
        const identificacionId = extractId(resIdentificacion);

        if (!fachadaId || !comprobanteId || !identificacionId) {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            'Error interno: el servidor no devolvio IDs de documento. ' +
              JSON.stringify([fachadaId, comprobanteId, identificacionId]),
          );
          return;
        }

        const dto: VerificarSolicitudDto = {
          fachadaDocumentId: fachadaId,
          addressProofDocumentId: comprobanteId,
          ineDocumentId: identificacionId,
          comentarios_verificador: this.comentarios,
          dictamen,
          kill_switch: this.rechazoDefinitivo(),
        };

        this.solicitudesService.verificar(solicitudId, dto).subscribe({
          next: () => {
            this.isSubmitting.set(false);

            const dictamenLabel = dictamen === 'CUMPLE' ? 'CUMPLE' : 'NO CUMPLE';
            this.successMessage.set(
              `Dictamen "${dictamenLabel}" enviado exitosamente.`,
            );

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
              this.errorMessage.set(
                `Error 400. IDs enviados: ${fachadaId}, ${comprobanteId}, ${identificacionId}. Mensaje: ${err.error?.message}`,
              );
            }
          },
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al subir las fotografías. Intenta de nuevo.');
      },
    });
  }

  /** Regresa al buzon de visitas */
  volver(): void {
    this.router.navigate(['/verificador/buzon-visitas']);
  }
  onFotoSelected(event: Event, tipo: 'fachada' | 'comprobante' | 'identificacion') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      switch (tipo) {
        case 'fachada':
          this.fotoFachada.set(file);
          this.previewFachada.set(previewUrl);
          break;
        case 'comprobante':
          this.fotoComprobante.set(file);
          this.previewComprobante.set(previewUrl);
          break;
        case 'identificacion':
          this.fotoIdentificacion.set(file);
          this.previewIdentificacion.set(previewUrl);
          break;
      }
    }
  }
}
