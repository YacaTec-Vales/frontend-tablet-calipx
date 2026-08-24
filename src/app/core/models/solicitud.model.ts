// ─── Enums ───────────────────────────────────────────────

export type EstadoSolicitud =
  | 'PRE_SOLICITUD'
  | 'EN_VERIFICACION'
  | 'DICTAMINADA'
  | 'AUTORIZADA'
  | 'RECHAZADA';

export type Dictamen = 'CUMPLE' | 'NO_CUMPLE';

export type SituacionVivienda =
  | 'PROPIA'
  | 'RENTADA'
  | 'LIQUIDADA'
  | 'INFONAVIT'
  | 'PRESTAMO_BANCARIO';

export type Parentesco = 'CONYUGE' | 'HIJO' | 'HIJA' | 'OTRO';

// ─── Sub-DTOs de datos_adicionales ───────────────────────

export interface Vehiculo {
  marca: string;
  modelo: string;
  anio: number;
  placas?: string;
}

export interface DatosDomicilio {
  situacion: SituacionVivienda;
  m2_construccion?: number;
  num_recamaras?: number;
  num_pisos?: number;
  tiempo_residencia_anios?: number;
}

export interface ReferenciaLaboral {
  establecimiento: string;
  direccion: string;
  antiguedad_anios: number;
  carta_laboral_presentada: boolean;
}

export interface LimiteCreditoOtraRelacion {
  institucion: string;
  monto_centavos: number;
  carta_acredita: boolean;
}

export interface Familiar {
  parentesco: Parentesco;
  nombre: string;
  edad: number;
  puesto: string;
  lugar_trabajo_o_estudio: string;
  referencia_contacto: string;
}

// ─── DTOs principales ────────────────────────────────────

/** 12 campos de datos_generales para POST /solicitudes */
export interface DatosGenerales {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  rfc: string;
  fecha_nacimiento: string;
  calle: string;
  numero: string;
  colonia: string;
  codigo_postal: string;
  lugar_nacimiento: string;
  estado: string;
  ciudad: string;
}

/** 5 bloques de datos_adicionales para POST /solicitudes */
export interface DatosAdicionales {
  vehiculos: Vehiculo[];
  domicilio: DatosDomicilio;
  referencias_laborales: ReferenciaLaboral[];
  limites_credito_en_otras_relaciones: LimiteCreditoOtraRelacion[];
  familiares: Familiar[];
}

/** Request body para POST /solicitudes (Coordinador crea solicitud) */
export interface CreateSolicitudDto {
  datos_generales: DatosGenerales;
  datos_adicionales: DatosAdicionales;
}

/** Request body para PATCH /solicitudes/:id (Coordinador edita) */
export type UpdateSolicitudDto = Partial<CreateSolicitudDto>;

/**
 * Request body para POST /solicitudes/:id/verificar (Verificador dictamina).
 *
 * El verificador sube cada foto via `POST /uploads/verification/:id` y
 * envia los UUIDs resultantes aqui. Esto reemplaza el envio de URLs
 * firmadas (que expiraban a los 15 min).
 */
export interface VerificarSolicitudDto {
  ineDocumentId?: string;
  addressProofDocumentId?: string;
  fachadaDocumentId?: string;
  comentarios_verificador: string;
  dictamen: Dictamen;
  kill_switch: boolean;
}

/**
 * Entrada de `verification_photos` en la respuesta de la solicitud.
 * Desde 2026-08-23 son UUIDs (`app.document.id`); los registros
 * historicos pueden contener URLs ser firmadas.
 */
export type VerificationPhotoEntry = string;

/** Detecta si una entrada es un UUID v4 o una URL firmada legacy. */
export function isVerificationPhotoUuid(entry: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    entry,
  );
}

/** Respuesta de GET /solicitudes/:id y GET /solicitudes */
export interface SolicitudResponse {
  id: string;
  folio?: string;
  estado: EstadoSolicitud;
  datos_generales: DatosGenerales;
  datos_adicionales?: DatosAdicionales;
  coordinador_id: string;
  verificador_id?: string;
  branch_id: string;
  /**
   * Lista de fotos de verificacion. Desde 2026-08-23 son UUIDs de
   * `app.document` (resolver via `GET /uploads/:id` para URL fresca);
   * registros historicos pueden contener URLs firmadas directas.
   */
  fotos_verificacion?: VerificationPhotoEntry[];
  comentarios_verificador?: string;
  dictamen?: Dictamen;
  kill_switch?: boolean;
  created_at: string;
  updated_at: string;
}
