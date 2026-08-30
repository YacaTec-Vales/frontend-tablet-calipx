import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosGenerales } from '../../../core/models/solicitud.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { FormsModule } from '@angular/forms';
import {
  validateName,
  validateEmail,
  validateCurp,
  validateRfc,
  validatePhone,
  validatePostalCode,
} from '../../../core/validators/form-validators';

@Component({
  selector: 'app-editar-solicitud-coordinador',
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent],
  templateUrl: './editar-solicitud.html',
})
export class EditarSolicitud implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly solicitudId = signal<string>('');
  readonly isLoaded = signal(false);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly comentariosVerificador = signal<string | null>(null);

  /** Habilita mostrar errores tras el primer submit. */
  readonly submitted = signal(false);

  // Form signals
  readonly nombre = signal('');
  readonly correo = signal('');
  readonly apellidoPaterno = signal('');
  readonly apellidoMaterno = signal('');
  readonly rfc = signal('');
  readonly curp = signal('');
  readonly phone = signal('');
  readonly calle = signal('');
  readonly numero = signal('');
  readonly colonia = signal('');
  readonly codigoPostal = signal('');

  // Errores por campo (computed)
  readonly nombreError = computed(() => {
    if (!this.submitted()) return '';
    return validateName(this.nombre(), 'nombre');
  });
  readonly apellidoPaternoError = computed(() => {
    if (!this.submitted()) return '';
    return validateName(this.apellidoPaterno(), 'apellido paterno');
  });
  readonly correoError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.correo()) return ''; // opcional segun backend
    return validateEmail(this.correo());
  });
  readonly rfcError = computed(() => {
    if (!this.submitted()) return '';
    return validateRfc(this.rfc(), 'RFC');
  });
  readonly curpError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.curp()) return ''; // opcional segun backend
    return validateCurp(this.curp(), 'CURP');
  });
  readonly phoneError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.phone()) return ''; // opcional segun backend
    return validatePhone(this.phone());
  });
  readonly codigoPostalError = computed(() => {
    if (!this.submitted()) return '';
    return validatePostalCode(this.codigoPostal(), 'codigo postal');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.solicitudId.set(id);
      this.loadSolicitud(id);
    } else {
      this.errorMessage.set('ID de solicitud no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadSolicitud(id: string): void {
    this.solicitudesService.getById(id).subscribe({
      next: (res) => {
        const s = res.data;
        this.nombre.set(s.datos_generales.nombre);
        this.correo.set(s.datos_generales.correo || '');
        this.apellidoPaterno.set(s.datos_generales.apellido_paterno);
        this.apellidoMaterno.set(s.datos_generales.apellido_materno || '');
        this.rfc.set(s.datos_generales.rfc);
        this.curp.set(s.datos_generales.curp || '');
        this.phone.set(s.datos_generales.phone || '');
        this.calle.set(s.datos_generales.calle);
        this.numero.set(s.datos_generales.numero);
        this.colonia.set(s.datos_generales.colonia);
        this.codigoPostal.set(s.datos_generales.codigo_postal);
        this.comentariosVerificador.set(s.comentarios_verificador || null);

        this.isLoaded.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar la solicitud');
        this.isLoading.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/coordinador/solicitud', this.solicitudId()]);
  }

  /** Lista plana de mensajes de error para el alert global. */
  getValidationErrors(): string[] {
    const errors: string[] = [];
    const e: Record<string, string> = {
      nombre: this.nombreError(),
      apellidoPaterno: this.apellidoPaternoError(),
      correo: this.correoError(),
      rfc: this.rfcError(),
      curp: this.curpError(),
      phone: this.phoneError(),
      codigoPostal: this.codigoPostalError(),
    };
    Object.values(e).forEach((msg) => {
      if (msg) errors.push(msg);
    });
    if (this.calle().length === 0) errors.push('La calle es requerida.');
    if (this.numero().length === 0) errors.push('El numero es requerido.');
    if (this.colonia().length === 0) errors.push('La colonia es requerida.');
    return errors;
  }

  canSubmit(): boolean {
    return this.getValidationErrors().length === 0 && !this.isSubmitting();
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (!this.canSubmit()) {
      this.errorMessage.set('Por favor corrige los siguientes errores: ' + this.getValidationErrors().join(' '));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const dto = {
      datos_generales: {
        nombre: this.nombre(),
        correo: this.correo(),
        apellido_paterno: this.apellidoPaterno(),
        apellido_materno: this.apellidoMaterno(),
        rfc: this.rfc().trim().toUpperCase(),
        curp: this.curp().trim().toUpperCase(),
        phone: this.phone().trim(),
        calle: this.calle(),
        numero: this.numero(),
        colonia: this.colonia(),
        codigo_postal: this.codigoPostal(),
      } as unknown as DatosGenerales // Casteamos de manera segura sin usar any
    };

    this.solicitudesService.update(this.solicitudId(), dto).subscribe({
      next: () => {
        this.successMessage.set('Solicitud actualizada correctamente. Ha regresado a estado EN_VERIFICACION.');
        this.isSubmitting.set(false);
        setTimeout(() => {
          this.volver();
        }, 2000);
      },
      error: (err) => {
        const code = err.error?.error?.code;
        if (code === 'DISTRIBUIDOR.SOLICITUD.NOT_EDITABLE' || code === 'DISTRIBUIDORES.NOT_EDITABLE') {
          this.errorMessage.set('La solicitud ya fue autorizada o rechazada y no puede ser modificada.');
        } else if (code === 'DISTRIBUIDOR.SOLICITUD.VALIDATION' || code === 'DISTRIBUIDORES.VALIDATION') {
          this.errorMessage.set('Faltan campos o el formato es incorrecto.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error al actualizar la solicitud');
        }
        this.isSubmitting.set(false);
      },
    });
  }
}
