import { Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CardComponent } from '../../../components/ui/card/card';
import { ConfirmModalComponent } from '../../../components/ui/confirm-modal/confirm-modal';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { PaginationComponent } from '../../../components/ui/pagination/pagination';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse, UpdateSolicitudDto, DatosGenerales, DatosAdicionales, Vehiculo, ReferenciaLaboral, LimiteCreditoOtraRelacion, Familiar, SituacionVivienda } from '../../../core/models/solicitud.model';

export interface AuditoriaFormData {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo?: string;
  phone?: string;
  rfc?: string;
  curp?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  calle?: string;
  numero?: string;
  colonia?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-auditoria',
  imports: [CommonModule, FormsModule, InputComponent, ButtonComponent, CardComponent, TableComponent, BadgeComponent, PaginationComponent, ConfirmModalComponent],
  templateUrl: './auditoria.html'
})
export class Auditoria implements OnInit, OnDestroy {
  private readonly solicitudesService = inject(SolicitudesService);

  readonly solicitudes = signal<SolicitudResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedSolicitud = signal<SolicitudResponse | null>(null);

  // STEPPER STATE
  readonly currentStep = signal(1);
  readonly totalSteps = 8;

  // STEP 1: Generales
  formData: AuditoriaFormData = {};
  originalData: AuditoriaFormData = {};

  // STEP 2: Domicilio
  readonly domicilioSituacion = signal<string>('');
  readonly domicilioM2 = signal<number | undefined>(undefined);
  readonly domicilioRecamaras = signal<number | undefined>(undefined);
  readonly domicilioPisos = signal<number | undefined>(undefined);
  readonly domicilioResidencia = signal<number | undefined>(undefined);
  
  // STEP 3: Vehículos
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly newVehiculoMarca = signal('');
  readonly newVehiculoModelo = signal('');
  readonly newVehiculoAnio = signal<number | undefined>(undefined);
  readonly newVehiculoPlacas = signal('');

  addVehiculo() {
    if (this.newVehiculoMarca() && this.newVehiculoModelo() && this.newVehiculoAnio()) {
      this.vehiculos.update(v => [...v, { marca: this.newVehiculoMarca(), modelo: this.newVehiculoModelo(), anio: this.newVehiculoAnio()!, placas: this.newVehiculoPlacas() || undefined }]);
      this.newVehiculoMarca.set(''); this.newVehiculoModelo.set(''); this.newVehiculoAnio.set(undefined); this.newVehiculoPlacas.set('');
    }
  }
  removeVehiculo(index: number) { this.vehiculos.update(v => v.filter((_, i) => i !== index)); }
  updateVehiculo(index: number, field: keyof Vehiculo, value: any) {
    this.vehiculos.update(v => v.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // STEP 4: Referencias
  readonly referenciasLaborales = signal<ReferenciaLaboral[]>([]);
  readonly newRefEstablecimiento = signal('');
  readonly newRefDireccion = signal('');
  readonly newRefAntiguedad = signal<number | undefined>(undefined);
  readonly newRefCarta = signal(false);

  addReferencia() {
    if (this.newRefEstablecimiento() && this.newRefDireccion() && this.newRefAntiguedad() !== undefined) {
      this.referenciasLaborales.update(r => [...r, { establecimiento: this.newRefEstablecimiento(), direccion: this.newRefDireccion(), antiguedad_anios: this.newRefAntiguedad()!, carta_laboral_presentada: this.newRefCarta() }]);
      this.newRefEstablecimiento.set(''); this.newRefDireccion.set(''); this.newRefAntiguedad.set(undefined); this.newRefCarta.set(false);
    }
  }
  removeReferencia(index: number) { this.referenciasLaborales.update(r => r.filter((_, i) => i !== index)); }
  updateReferencia(index: number, field: keyof ReferenciaLaboral, value: any) {
    this.referenciasLaborales.update(r => r.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // STEP 5: Límites
  readonly limitesCredito = signal<LimiteCreditoOtraRelacion[]>([]);
  readonly newLimiteInstitucion = signal('');
  readonly newLimiteMonto = signal<number | undefined>(undefined);
  readonly newLimiteCarta = signal(false);

  addLimite() {
    if (this.newLimiteInstitucion() && this.newLimiteMonto() !== undefined) {
      this.limitesCredito.update(l => [...l, { institucion: this.newLimiteInstitucion(), monto_centavos: this.newLimiteMonto()!, carta_acredita: this.newLimiteCarta() }]);
      this.newLimiteInstitucion.set(''); this.newLimiteMonto.set(undefined); this.newLimiteCarta.set(false);
    }
  }
  removeLimite(index: number) { this.limitesCredito.update(l => l.filter((_, i) => i !== index)); }
  updateLimite(index: number, field: keyof LimiteCreditoOtraRelacion, value: any) {
    this.limitesCredito.update(l => l.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // STEP 6: Familiares
  readonly familiares = signal<Familiar[]>([]);
  readonly newFamiliarParentesco = signal('');
  readonly newFamiliarNombre = signal('');
  readonly newFamiliarEdad = signal<number | undefined>(undefined);
  readonly newFamiliarPuesto = signal('');
  readonly newFamiliarLugar = signal('');
  readonly newFamiliarContacto = signal('');

  addFamiliar() {
    if (this.newFamiliarParentesco() && this.newFamiliarNombre() && this.newFamiliarEdad() !== undefined) {
      this.familiares.update(f => [...f, { parentesco: this.newFamiliarParentesco() as any, nombre: this.newFamiliarNombre(), edad: this.newFamiliarEdad()!, puesto: this.newFamiliarPuesto(), lugar_trabajo_o_estudio: this.newFamiliarLugar(), referencia_contacto: this.newFamiliarContacto() }]);
      this.newFamiliarParentesco.set(''); this.newFamiliarNombre.set(''); this.newFamiliarEdad.set(undefined); this.newFamiliarPuesto.set(''); this.newFamiliarLugar.set(''); this.newFamiliarContacto.set('');
    }
  }
  removeFamiliar(index: number) { this.familiares.update(f => f.filter((_, i) => i !== index)); }
  updateFamiliar(index: number, field: keyof Familiar, value: any) {
    this.familiares.update(f => f.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // Audit state
  readonly showAuditLog = signal(false);
  readonly auditChanges = signal<{ field: string, old: string, new: string }[]>([]);
  showConfirmModal = signal(false);
  readonly isSubmitting = signal(false);

  // Snapshot original de datos adicionales para el diff
  private originalDatosAdicionalesJson = '';

  readonly estadosMexicanos = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Coahuila', 'Colima', 'Ciudad de México', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  // Pagination & Filtering
  readonly itemsPerPage = signal(10);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');
  readonly currentFilter = signal<string>('');

  readonly filteredSolicitudes = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();
    const filter = this.currentFilter();
    let all = this.solicitudes();
    if (filter) all = all.filter(s => s.estado === filter);
    if (search) all = all.filter(s => {
      const text = `${s.folio || ''} ${s.datos_generales.nombre} ${s.datos_generales.apellido_paterno} ${s.datos_generales.rfc || ''}`.toLowerCase();
      return text.includes(search);
    });
    return all;
  });

  readonly paginatedSolicitudes = computed(() => {
    const all = this.filteredSolicitudes();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return all.slice(start, start + this.itemsPerPage());
  });

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit() { this.loadSolicitudes(); }
  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
  }

  loadSolicitudes(isBackground = false) {
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
    if (!isBackground) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }
    this.solicitudesService.list().subscribe({
      next: (res) => {
        const auditables = res.data.filter(s => s.estado === 'EN_VERIFICACION' || s.estado === 'DICTAMINADA');
        this.solicitudes.set(auditables);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: (err) => {
        if (!isBackground) {
          this.errorMessage.set(err.error?.message || 'Error al cargar las solicitudes');
          this.isLoading.set(false);
        }
        this.scheduleNextPoll();
      }
    });
  }

  private scheduleNextPoll() {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => this.loadSolicitudes(true), 15000);
  }

  seleccionar(solicitud: SolicitudResponse) {
    this.selectedSolicitud.set(solicitud);
    this.errorMessage.set(null);
    
    const d = solicitud.datos_generales;
    const editableData = {
      nombre: d.nombre, apellido_paterno: d.apellido_paterno, apellido_materno: d.apellido_materno,
      correo: d.correo, phone: d.phone, rfc: d.rfc, curp: d.curp, fecha_nacimiento: d.fecha_nacimiento,
      lugar_nacimiento: d.lugar_nacimiento, calle: d.calle, numero: d.numero, colonia: d.colonia,
      codigo_postal: d.codigo_postal, ciudad: d.ciudad, estado: d.estado
    };
    this.formData = { ...editableData };
    this.originalData = { ...editableData };

    const ad = solicitud.datos_adicionales;
    this.originalDatosAdicionalesJson = JSON.stringify(ad || {});

    if (ad && ad.domicilio) {
      this.domicilioSituacion.set(ad.domicilio.situacion);
      this.domicilioM2.set(ad.domicilio.m2_construccion);
      this.domicilioRecamaras.set(ad.domicilio.num_recamaras);
      this.domicilioPisos.set(ad.domicilio.num_pisos);
      this.domicilioResidencia.set(ad.domicilio.tiempo_residencia_anios);
      
      this.vehiculos.set(ad.vehiculos ? [...ad.vehiculos] : []);
      this.referenciasLaborales.set(ad.referencias_laborales ? [...ad.referencias_laborales] : []);
      this.limitesCredito.set(ad.limites_credito_en_otras_relaciones ? [...ad.limites_credito_en_otras_relaciones] : []);
      this.familiares.set(ad.familiares ? [...ad.familiares] : []);
    } else {
      this.domicilioSituacion.set('');
      this.domicilioM2.set(undefined);
      this.domicilioRecamaras.set(undefined);
      this.domicilioPisos.set(undefined);
      this.domicilioResidencia.set(undefined);
      this.vehiculos.set([]);
      this.referenciasLaborales.set([]);
      this.limitesCredito.set([]);
      this.familiares.set([]);
    }

    this.showAuditLog.set(false);
    this.auditChanges.set([]);
    this.currentStep.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverLista() {
    this.selectedSolicitud.set(null);
    this.errorMessage.set(null);
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
      window.scrollTo(0, 0);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      window.scrollTo(0, 0);
    }
  }

  getDatosAdicionalesActuales(): DatosAdicionales {
    return {
      domicilio: {
        situacion: this.domicilioSituacion() as SituacionVivienda,
        m2_construccion: this.domicilioM2(),
        num_recamaras: this.domicilioRecamaras(),
        num_pisos: this.domicilioPisos(),
        tiempo_residencia_anios: this.domicilioResidencia(),
      },
      vehiculos: this.vehiculos(),
      referencias_laborales: this.referenciasLaborales(),
      limites_credito_en_otras_relaciones: this.limitesCredito(),
      familiares: this.familiares()
    };
  }

  private deepEqual(x: any, y: any): boolean {
    if (x === y) return true;
    if (typeof x !== 'object' || typeof y !== 'object' || x == null || y == null) return false;
    const keysX = Object.keys(x), keysY = Object.keys(y);
    if (keysX.length !== keysY.length) return false;
    for (const key of keysX) {
      if (!keysY.includes(key)) return false;
      if (!this.deepEqual(x[key], y[key])) return false;
    }
    return true;
  }

  private compareObjects(prefix: string, oldObj: any, newObj: any, changes: { field: string, old: string, new: string }[]) {
    const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    for (const key of keys) {
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];
      if (!this.deepEqual(oldVal, newVal)) {
        if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
            this.compareObjects(`${prefix} - ${key}`, oldVal, newVal, changes);
        } else {
            changes.push({
              field: `${prefix} - ${key}`,
              old: oldVal !== undefined ? String(oldVal) : '(vacío)',
              new: newVal !== undefined ? String(newVal) : '(vacío)'
            });
        }
      }
    }
  }

  private compareArrays(prefix: string, oldArr: any[], newArr: any[], changes: { field: string, old: string, new: string }[]) {
    const maxLen = Math.max(oldArr?.length || 0, newArr?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      const oldItem = oldArr?.[i];
      const newItem = newArr?.[i];
      
      if (oldItem && !newItem) {
        changes.push({ field: `${prefix} [${i + 1}] (Eliminado)`, old: JSON.stringify(oldItem, null, 2), new: '(vacío)' });
      } else if (!oldItem && newItem) {
        changes.push({ field: `${prefix} [${i + 1}] (Nuevo)`, old: '(vacío)', new: JSON.stringify(newItem, null, 2) });
      } else if (!this.deepEqual(oldItem, newItem)) {
        this.compareObjects(`${prefix} [${i + 1}]`, oldItem, newItem, changes);
      }
    }
  }

  revisarCambios() {
    const changes: { field: string, old: string, new: string }[] = [];
    
    // Comparar Generales
    const fieldsToCheck = [
      'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'phone', 
      'rfc', 'curp', 'fecha_nacimiento', 'lugar_nacimiento', 
      'calle', 'numero', 'colonia', 'codigo_postal', 'ciudad', 'estado'
    ];
    fieldsToCheck.forEach(field => {
      // Usar '==' para evitar falsos positivos con null vs undefined
      if (this.formData[field] != this.originalData[field] && (this.formData[field] || this.originalData[field])) {
        changes.push({ field, old: this.originalData[field] || '', new: this.formData[field] || '' });
      }
    });

    // Comparar Adicionales
    const currentAd = this.getDatosAdicionalesActuales();
    const originalAd: DatosAdicionales = JSON.parse(this.originalDatosAdicionalesJson || '{}');
    
    if (!this.deepEqual(currentAd.domicilio, originalAd.domicilio)) {
      this.compareObjects('Domicilio', originalAd.domicilio || {}, currentAd.domicilio || {}, changes);
    }
    if (!this.deepEqual(currentAd.vehiculos, originalAd.vehiculos)) {
      this.compareArrays('Vehículos', originalAd.vehiculos || [], currentAd.vehiculos || [], changes);
    }
    if (!this.deepEqual(currentAd.referencias_laborales, originalAd.referencias_laborales)) {
      this.compareArrays('Referencias Laborales', originalAd.referencias_laborales || [], currentAd.referencias_laborales || [], changes);
    }
    if (!this.deepEqual(currentAd.limites_credito_en_otras_relaciones, originalAd.limites_credito_en_otras_relaciones)) {
      this.compareArrays('Límites de Crédito', originalAd.limites_credito_en_otras_relaciones || [], currentAd.limites_credito_en_otras_relaciones || [], changes);
    }
    if (!this.deepEqual(currentAd.familiares, originalAd.familiares)) {
      this.compareArrays('Familiares', originalAd.familiares || [], currentAd.familiares || [], changes);
    }

    this.auditChanges.set(changes);
    if (changes.length > 0) {
      this.showAuditLog.set(true);
    } else {
      this.errorMessage.set("No hay cambios que guardar.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarGuardado() { this.showAuditLog.set(false); }
  preConfirmarGuardado() { this.showConfirmModal.set(true); }

  confirmarGuardado() {
    this.showConfirmModal.set(false);
    const solicitud = this.selectedSolicitud();
    if (!solicitud) return;
    
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    
    const dto: UpdateSolicitudDto = {
      datos_generales: this.formData as unknown as DatosGenerales,
      datos_adicionales: this.getDatosAdicionalesActuales()
    };
    
    this.solicitudesService.update(solicitud.id, dto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showAuditLog.set(false);
        this.selectedSolicitud.set(null);
        this.loadSolicitudes();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar los cambios de auditoría');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
