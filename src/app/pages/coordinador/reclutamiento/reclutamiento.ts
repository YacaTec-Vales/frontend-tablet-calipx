import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';
import { ConfirmModalComponent } from '../../../components/ui/confirm-modal/confirm-modal';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { UploadsService } from '../../../core/services/uploads.service';
import {
  CreateSolicitudDto,
  DatosGenerales,
  DatosAdicionales,
  Vehiculo,
  DatosDomicilio,
  ReferenciaLaboral,
  LimiteCreditoOtraRelacion,
  Familiar,
} from '../../../core/models/solicitud.model';
import {
  validateName,
  validateEmail,
  validateCurp,
  validateRfc,
  validatePhone,
  validatePostalCode,
  validateBirthDate,
  validateBankName,
  validatePositiveAmount,
} from '../../../core/validators/form-validators';

/**
 * Pagina de reclutamiento del Coordinador.
 *
 * Permite crear una solicitud nueva con los 12 campos de
 * datos_generales y los 5 bloques de datos_adicionales.
 * Conecta con POST /solicitudes.
 */
@Component({
  selector: 'app-reclutamiento',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './reclutamiento.html',
})
export class Reclutamiento {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly uploadsService = inject(UploadsService);

  // ─── Datos Generales (13 campos) ───────────────────────

  readonly nombre = signal('');
  readonly correo = signal('');
  readonly apellidoPaterno = signal('');
  readonly apellidoMaterno = signal('');
  readonly rfc = signal('');
  readonly curp = signal('');
  readonly phone = signal('');
  readonly fechaNacimiento = signal('');
  readonly calle = signal('');
  readonly numero = signal('');
  readonly colonia = signal('');
  readonly codigoPostal = signal('');
  readonly lugarNacimiento = signal('');
  readonly estado = signal('');
  readonly ciudad = signal('');
  readonly ineFile = signal<File | null>(null);
  readonly inePreviewUrl = signal<string | null>(null);

  onIneSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.ineFile.set(file);
      
      // Liberar URL previa si existía
      if (this.inePreviewUrl()) {
        URL.revokeObjectURL(this.inePreviewUrl()!);
      }
      
      // Si es imagen, generar un preview local
      if (file.type.startsWith('image/')) {
        this.inePreviewUrl.set(URL.createObjectURL(file));
      } else {
        this.inePreviewUrl.set(null); // Es un PDF u otro formato
      }
    } else {
      this.ineFile.set(null);
      if (this.inePreviewUrl()) {
        URL.revokeObjectURL(this.inePreviewUrl()!);
        this.inePreviewUrl.set(null);
      }
    }
  }

  // ─── Datos Adicionales (5 bloques) ─────────────────────

  /** Vehiculos: max 5 */
  readonly vehiculos = signal<Vehiculo[]>([]);

  /** Domicilio */
  readonly domicilioSituacion = signal<string>('');
  readonly domicilioM2 = signal<number | undefined>(undefined);
  readonly domicilioRecamaras = signal<number | undefined>(undefined);
  readonly domicilioPisos = signal<number | undefined>(undefined);
  readonly domicilioResidencia = signal<number | undefined>(undefined);

  /** Referencias laborales: max 10 */
  readonly referenciasLaborales = signal<ReferenciaLaboral[]>([]);

  /** Limites de credito en otras relaciones: max 10 */
  readonly limitesCredito = signal<LimiteCreditoOtraRelacion[]>([]);

  /** Familiares: max 10 */
  readonly familiares = signal<Familiar[]>([]);

  // ─── Estados locales para agregar items a las listas ───

  // Nuevo Vehiculo
  readonly newVehiculoMarca = signal('');
  readonly newVehiculoModelo = signal('');
  readonly newVehiculoAnio = signal<number | undefined>(undefined);
  readonly newVehiculoPlacas = signal('');

  addVehiculo() {
    const marca = this.newVehiculoMarca();
    const modelo = this.newVehiculoModelo();
    const anio = this.newVehiculoAnio();

    if (!marca || !modelo || anio === undefined) {
      this.errorMessage.set('Marca, modelo y anio son obligatorios.');
      return;
    }
    if (!Number.isFinite(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) {
      this.errorMessage.set('El anio debe estar entre 1900 y el anio actual.');
      return;
    }
    this.errorMessage.set('');
    this.vehiculos.update(v => [...v, {
      marca,
      modelo,
      anio,
      placas: this.newVehiculoPlacas() || undefined,
    }]);
    this.newVehiculoMarca.set('');
    this.newVehiculoModelo.set('');
    this.newVehiculoAnio.set(undefined);
    this.newVehiculoPlacas.set('');
  }

  removeVehiculo(index: number) {
    this.vehiculos.update(v => v.filter((_, i) => i !== index));
  }

  // Nueva Referencia Laboral
  readonly newRefEstablecimiento = signal('');
  readonly newRefDireccion = signal('');
  readonly newRefAntiguedad = signal<number | undefined>(undefined);
  readonly newRefCarta = signal(false);

  addReferencia() {
    const establecimiento = this.newRefEstablecimiento();
    const direccion = this.newRefDireccion();
    const antiguedad = this.newRefAntiguedad();

    if (!establecimiento || !direccion || antiguedad === undefined) {
      this.errorMessage.set('Establecimiento, direccion y antiguedad son obligatorios.');
      return;
    }
    if (!Number.isFinite(antiguedad) || antiguedad < 0 || antiguedad > 80) {
      this.errorMessage.set('La antiguedad debe estar entre 0 y 80 anios.');
      return;
    }
    this.errorMessage.set('');
    this.referenciasLaborales.update(r => [...r, {
      establecimiento,
      direccion,
      antiguedad_anios: antiguedad,
      carta_laboral_presentada: this.newRefCarta(),
    }]);
    this.newRefEstablecimiento.set('');
    this.newRefDireccion.set('');
    this.newRefAntiguedad.set(undefined);
    this.newRefCarta.set(false);
  }

  removeReferencia(index: number) {
    this.referenciasLaborales.update(r => r.filter((_, i) => i !== index));
  }

  // Nuevo Límite de Crédito
  readonly newLimiteInstitucion = signal('');
  readonly newLimiteMonto = signal<number | undefined>(undefined);
  readonly newLimiteCarta = signal(false);

  addLimite() {
    const institucion = this.newLimiteInstitucion();
    const monto = this.newLimiteMonto();

    if (!institucion || monto === undefined) {
      this.errorMessage.set('Institucion y monto son obligatorios.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      this.errorMessage.set('El monto debe ser mayor a cero.');
      return;
    }
    this.errorMessage.set('');
    this.limitesCredito.update(l => [...l, {
      institucion,
      monto_centavos: monto,
      carta_acredita: this.newLimiteCarta(),
    }]);
    this.newLimiteInstitucion.set('');
    this.newLimiteMonto.set(undefined);
    this.newLimiteCarta.set(false);
  }

  removeLimite(index: number) {
    this.limitesCredito.update(l => l.filter((_, i) => i !== index));
  }

  // Nuevo Familiar
  readonly newFamiliarParentesco = signal('');
  readonly newFamiliarNombre = signal('');
  readonly newFamiliarEdad = signal<number | undefined>(undefined);
  readonly newFamiliarPuesto = signal('');
  readonly newFamiliarLugar = signal('');
  readonly newFamiliarContacto = signal('');

  addFamiliar() {
    const parentesco = this.newFamiliarParentesco();
    const nombre = this.newFamiliarNombre();
    const edad = this.newFamiliarEdad();
    const puesto = this.newFamiliarPuesto();
    const lugar = this.newFamiliarLugar();
    const contacto = this.newFamiliarContacto();

    if (!parentesco || !nombre || edad === undefined || !puesto || !lugar || !contacto) {
      this.errorMessage.set('Todos los campos del familiar son obligatorios.');
      return;
    }
    const nombreErr = validateName(nombre, 'nombre del familiar');
    if (nombreErr) {
      this.errorMessage.set(nombreErr);
      return;
    }
    if (!Number.isFinite(edad) || edad < 0 || edad > 120) {
      this.errorMessage.set('La edad debe estar entre 0 y 120 anios.');
      return;
    }
    this.errorMessage.set('');
    this.familiares.update(f => [...f, {
      parentesco: parentesco as any,
      nombre,
      edad,
      puesto,
      lugar_trabajo_o_estudio: lugar,
      referencia_contacto: contacto,
    }]);
    this.newFamiliarParentesco.set('');
    this.newFamiliarNombre.set('');
    this.newFamiliarEdad.set(undefined);
    this.newFamiliarPuesto.set('');
    this.newFamiliarLugar.set('');
    this.newFamiliarContacto.set('');
  }

  removeFamiliar(index: number) {
    this.familiares.update(f => f.filter((_, i) => i !== index));
  }

  // ─── Estado del formulario y Wizard ─────────────────────────────

  readonly currentStep = signal(1);
  readonly totalSteps = 6;
  readonly showConfirmModal = signal(false);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  nextStep(): void {
    if (this.currentStep() === 1) {
      this.showStep1Errors.set(true);
    }
    if (this.currentStep() < this.totalSteps && this.canAdvanceStep()) {
      this.currentStep.update(s => s + 1);
      this.showStep1Errors.set(false);
      window.scrollTo(0, 0);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      window.scrollTo(0, 0);
    }
  }

  // ─── Errores por campo (paso 1) ───────────────────────

  readonly nombreError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateName(this.nombre(), 'nombre');
  });

  readonly apellidoPaternoError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateName(this.apellidoPaterno(), 'apellido paterno');
  });

  readonly apellidoMaternoError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateName(this.apellidoMaterno(), 'apellido materno');
  });

  readonly correoError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateEmail(this.correo());
  });

  readonly rfcError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateRfc(this.rfc(), 'RFC');
  });

  readonly curpError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateCurp(this.curp(), 'CURP');
  });

  readonly phoneError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validatePhone(this.phone());
  });

  readonly fechaNacimientoError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validateBirthDate(this.fechaNacimiento());
  });

  readonly codigoPostalError = computed(() => {
    if (!this.showStep1Errors()) return '';
    return validatePostalCode(this.codigoPostal(), 'codigo postal');
  });

  readonly ineError = computed(() => {
    if (!this.showStep1Errors()) return '';
    if (!this.ineFile()) return 'La identificacion (INE) es obligatoria.';
    return '';
  });

  /** Habilita mostrar errores en paso 1 tras click en Siguiente. */
  readonly showStep1Errors = signal(false);

  /** Valida si se puede avanzar al siguiente paso */
  canAdvanceStep(): boolean {
    if (this.currentStep() === 1) {
      return (
        !this.nombreError() &&
        !this.apellidoPaternoError() &&
        !this.apellidoMaternoError() &&
        !this.correoError() &&
        !this.rfcError() &&
        !this.curpError() &&
        !this.phoneError() &&
        !this.fechaNacimientoError() &&
        !this.codigoPostalError() &&
        !this.ineError() &&
        this.calle().trim().length > 0 &&
        this.numero().trim().length > 0 &&
        this.colonia().trim().length > 0 &&
        this.lugarNacimiento().trim().length > 0 &&
        this.estado().trim().length > 0 &&
        this.ciudad().trim().length > 0
      );
    }
    // Paso 2 a 5 no tienen campos obligatorios estrictos que bloqueen avanzar
    return true;
  }

  /** Se puede enviar solo en el ultimo paso */
  readonly canSubmit = computed(() => {
    return this.currentStep() === this.totalSteps && !this.isSubmitting();
  });

  // ─── Estados mexicanos (enum para el select) ───────────

  readonly estadosMexicanos = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas',
  ];

  // ─── Acciones ──────────────────────────────────────────

  /** Muestra modal de confirmación antes de enviar */
  onSubmit(): void {
    const file = this.ineFile();
    if (!file) {
      this.errorMessage.set('La identificación (INE) es obligatoria.');
      return;
    }
    this.showConfirmModal.set(true);
  }

  /** Envia la solicitud al backend via POST /solicitudes */
  confirmarSubmit(): void {
    this.showConfirmModal.set(false);
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const file = this.ineFile();
    if (!file) {
      this.errorMessage.set('La identificación (INE) es obligatoria.');
      this.isSubmitting.set(false);
      return;
    }

    // 1. Subir la INE primero
    this.uploadsService.uploadFile(file, 'ine').subscribe({
      next: (uploadRes) => {
        const documentId = uploadRes.data.id;
        this.submitSolicitud(documentId);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al subir la identificación (INE). Verifica tu conexión o intenta con otro archivo.');
      }
    });
  }

  private submitSolicitud(ineDocumentId: string): void {
    const datosGenerales: DatosGenerales = {
      nombre: this.nombre(),
      correo: this.correo(),
      apellido_paterno: this.apellidoPaterno(),
      apellido_materno: this.apellidoMaterno(),
      rfc: this.rfc().trim().toUpperCase(),
      curp: this.curp().trim().toUpperCase(),
      phone: this.phone().trim(),
      fecha_nacimiento: this.fechaNacimiento(),
      calle: this.calle(),
      numero: this.numero(),
      colonia: this.colonia(),
      codigo_postal: this.codigoPostal(),
      lugar_nacimiento: this.lugarNacimiento(),
      estado: this.estado(),
      ciudad: this.ciudad(),
      ine_document_id: ineDocumentId,
    };

    const domicilio: DatosDomicilio = {
      situacion: (this.domicilioSituacion() || 'PROPIA') as DatosDomicilio['situacion'],
      m2_construccion: this.domicilioM2(),
      num_recamaras: this.domicilioRecamaras(),
      num_pisos: this.domicilioPisos(),
      tiempo_residencia_anios: this.domicilioResidencia(),
    };

    const datosAdicionales: DatosAdicionales = {
      vehiculos: this.vehiculos(),
      domicilio,
      referencias_laborales: this.referenciasLaborales(),
      limites_credito_en_otras_relaciones: this.limitesCredito(),
      familiares: this.familiares(),
    };

    const dto: CreateSolicitudDto = {
      datos_generales: datosGenerales,
      datos_adicionales: datosAdicionales,
    };

    this.solicitudesService.create(dto).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        const folio = response.data.folio ?? response.data.id.slice(0, 8);
        this.successMessage.set(
          `Solicitud ${folio} creada exitosamente. Estado: EN VERIFICACIÓN.`,
        );
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const code = err.error?.error?.code;

        switch (code) {
          case 'DISTRIBUIDOR.SOLICITUD.ALREADY_OPEN':
            this.errorMessage.set('No puedes crear una nueva solicitud porque ya tienes otra en proceso. Ciérrala o cancélala primero.');
            break;
          case 'DISTRIBUIDORES.VALIDATION':
            this.errorMessage.set(
              `Error de validación: ${err.error?.message ?? 'Revisa los campos obligatorios.'}`,
            );
            break;
          case 'DISTRIBUIDORES.COORDINATOR_NO_BRANCH':
            this.errorMessage.set('No tienes una sucursal asignada. Contacta al administrador.');
            break;
          default:
            this.errorMessage.set(err.error?.message ?? 'Error al crear la solicitud.');
            break;
        }
      },
    });
  }

  /** Limpia todos los campos del formulario */
  private resetForm(): void {
    this.nombre.set('');
    this.correo.set('');
    this.apellidoPaterno.set('');
    this.apellidoMaterno.set('');
    this.rfc.set('');
    this.fechaNacimiento.set('');
    this.calle.set('');
    this.numero.set('');
    this.colonia.set('');
    this.codigoPostal.set('');
    this.lugarNacimiento.set('');
    this.estado.set('');
    this.ciudad.set('');

    // Reset file y preview
    this.ineFile.set(null);
    if (this.inePreviewUrl()) {
      URL.revokeObjectURL(this.inePreviewUrl()!);
      this.inePreviewUrl.set(null);
    }

    this.vehiculos.set([]);
    this.domicilioSituacion.set('');
    this.domicilioM2.set(undefined);
    this.domicilioRecamaras.set(undefined);
    this.domicilioPisos.set(undefined);
    this.domicilioResidencia.set(undefined);
    this.referenciasLaborales.set([]);
    this.limitesCredito.set([]);
    this.familiares.set([]);
    this.currentStep.set(1);
    this.showStep1Errors.set(false);
  }

  /** Rellena el formulario con datos de prueba basados en el Swagger */
  fillTestData(): void {
    this.nombre.set('Carlos');
    this.correo.set('carlos@ejemplo.com');
    this.apellidoPaterno.set('Lopez');
    this.apellidoMaterno.set('Hernandez');
    this.rfc.set('LOHC900101AAA');
    this.curp.set('LOHC900101HCLPRRA1');
    this.phone.set('8711234567');
    this.fechaNacimiento.set('1990-01-01');
    this.calle.set('Av. Norte 123');
    this.numero.set('456');
    this.colonia.set('Centro');
    this.codigoPostal.set('27000');
    this.lugarNacimiento.set('Torreon');
    this.estado.set('Coahuila');
    this.ciudad.set('Torreon');

    this.vehiculos.set([
      { marca: 'Toyota', modelo: 'Corolla', anio: 2018, placas: 'ABC-123-A' }
    ]);
    this.domicilioSituacion.set('PROPIA');
    this.domicilioM2.set(80);
    this.domicilioRecamaras.set(3);
    this.domicilioPisos.set(2);
    this.domicilioResidencia.set(5);

    this.referenciasLaborales.set([
      { establecimiento: 'Luxor', direccion: 'Av. Reforma 123, Torreon', antiguedad_anios: 3, carta_laboral_presentada: true }
    ]);
    
    this.limitesCredito.set([
      { institucion: 'Banco Azteca', monto_centavos: 500000, carta_acredita: true }
    ]);

    this.familiares.set([
      { parentesco: 'CONYUGE', nombre: 'Maria Hernandez', edad: 35, puesto: 'Docente', lugar_trabajo_o_estudio: 'CBTIS 123', referencia_contacto: 'Maria@x.com | 8711234567' }
    ]);
  }
}
