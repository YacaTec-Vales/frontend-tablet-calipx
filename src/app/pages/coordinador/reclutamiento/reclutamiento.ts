import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
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

/**
 * Pagina de reclutamiento del Coordinador.
 *
 * Permite crear una solicitud nueva con los 12 campos de
 * datos_generales y los 5 bloques de datos_adicionales.
 * Conecta con POST /solicitudes.
 */
@Component({
  selector: 'app-reclutamiento',
  imports: [FormsModule, InputComponent, ButtonComponent, CardComponent],
  templateUrl: './reclutamiento.html',
})
export class Reclutamiento {
  private readonly solicitudesService = inject(SolicitudesService);

  // ─── Datos Generales (12 campos) ───────────────────────

  readonly nombre = signal('');
  readonly apellidoPaterno = signal('');
  readonly apellidoMaterno = signal('');
  readonly rfc = signal('');
  readonly fechaNacimiento = signal('');
  readonly calle = signal('');
  readonly numero = signal('');
  readonly colonia = signal('');
  readonly codigoPostal = signal('');
  readonly lugarNacimiento = signal('');
  readonly estado = signal('');
  readonly ciudad = signal('');

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

  // ─── Estado del formulario ─────────────────────────────

  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  /** Validacion basica: campos obligatorios de datos_generales */
  readonly canSubmit = computed(() => {
    return (
      this.nombre().trim().length > 0 &&
      this.apellidoPaterno().trim().length > 0 &&
      this.apellidoMaterno().trim().length > 0 &&
      this.rfc().trim().length === 13 &&
      this.fechaNacimiento().trim().length > 0 &&
      this.calle().trim().length > 0 &&
      this.numero().trim().length > 0 &&
      this.colonia().trim().length > 0 &&
      this.codigoPostal().trim().length === 5 &&
      this.lugarNacimiento().trim().length > 0 &&
      this.estado().trim().length > 0 &&
      this.ciudad().trim().length > 0 &&
      !this.isSubmitting()
    );
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

  /** Envia la solicitud al backend via POST /solicitudes */
  onSubmit(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const datosGenerales: DatosGenerales = {
      nombre: this.nombre(),
      apellido_paterno: this.apellidoPaterno(),
      apellido_materno: this.apellidoMaterno(),
      rfc: this.rfc().toUpperCase(),
      fecha_nacimiento: this.fechaNacimiento(),
      calle: this.calle(),
      numero: this.numero(),
      colonia: this.colonia(),
      codigo_postal: this.codigoPostal(),
      lugar_nacimiento: this.lugarNacimiento(),
      estado: this.estado(),
      ciudad: this.ciudad(),
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
    this.vehiculos.set([]);
    this.domicilioSituacion.set('');
    this.domicilioM2.set(undefined);
    this.domicilioRecamaras.set(undefined);
    this.domicilioPisos.set(undefined);
    this.domicilioResidencia.set(undefined);
    this.referenciasLaborales.set([]);
    this.limitesCredito.set([]);
    this.familiares.set([]);
  }
}
