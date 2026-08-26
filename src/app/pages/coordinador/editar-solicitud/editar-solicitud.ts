import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosGenerales } from '../../../core/models/solicitud.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { FormsModule } from '@angular/forms';

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

  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (this.nombre().length === 0) errors.push('El nombre es requerido.');
    if (this.correo().length === 0 || !this.correo().includes('@')) errors.push('Un correo válido es requerido.');
    if (this.apellidoPaterno().length === 0) errors.push('El apellido paterno es requerido.');
    if (this.rfc().length !== 13) errors.push('El RFC debe tener exactamente 13 caracteres.');
    if (this.curp().length !== 18) errors.push('La CURP debe tener exactamente 18 caracteres.');
    if (this.phone().length !== 10) errors.push('El teléfono debe tener exactamente 10 dígitos.');
    if (this.calle().length === 0) errors.push('La calle es requerida.');
    if (this.numero().length === 0) errors.push('El número es requerido.');
    if (this.colonia().length === 0) errors.push('La colonia es requerida.');
    if (this.codigoPostal().length !== 5) errors.push('El código postal debe tener 5 dígitos.');
    return errors;
  }

  canSubmit(): boolean {
    return this.getValidationErrors().length === 0 && !this.isSubmitting();
  }

  onSubmit(): void {
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
