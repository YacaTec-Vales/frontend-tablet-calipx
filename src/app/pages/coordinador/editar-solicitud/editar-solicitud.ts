import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-editar-solicitud-coordinador',
  standalone: true,
  imports: [CommonModule, CardComponent, InputComponent, ButtonComponent],
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
  readonly requiresManagerAuth = signal(false);

  // Form signals
  readonly nombre = signal('');
  readonly apellidoPaterno = signal('');
  readonly apellidoMaterno = signal('');
  readonly rfc = signal('');
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
        this.apellidoPaterno.set(s.datos_generales.apellido_paterno);
        this.apellidoMaterno.set(s.datos_generales.apellido_materno || '');
        this.rfc.set(s.datos_generales.rfc);
        this.calle.set(s.datos_generales.calle);
        this.numero.set(s.datos_generales.numero);
        this.colonia.set(s.datos_generales.colonia);
        this.codigoPostal.set(s.datos_generales.codigo_postal);

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

  canSubmit(): boolean {
    return (
      this.nombre().length > 0 &&
      this.apellidoPaterno().length > 0 &&
      this.rfc().length === 13 &&
      this.calle().length > 0 &&
      this.numero().length > 0 &&
      this.colonia().length > 0 &&
      this.codigoPostal().length === 5 &&
      !this.isSubmitting() &&
      !this.requiresManagerAuth()
    );
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.requiresManagerAuth.set(false);

    const dto = {
      datos_generales: {
        nombre: this.nombre(),
        apellido_paterno: this.apellidoPaterno(),
        apellido_materno: this.apellidoMaterno(),
        rfc: this.rfc(),
        calle: this.calle(),
        numero: this.numero(),
        colonia: this.colonia(),
        codigo_postal: this.codigoPostal(),
      } as any // Bypass strict TS check for partial nested updates, as backend allows it for PATCH
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
        if (code === 'DISTRIBUIDORES.MODIFICATION_REQUIRES_AUTH') {
          this.requiresManagerAuth.set(true);
          this.errorMessage.set('Atención: Esta solicitud ya fue corregida previamente. Se requiere autorización de un Gerente para editarla nuevamente.');
        } else if (code === 'DISTRIBUIDORES.NOT_EDITABLE') {
          this.errorMessage.set('La solicitud ya fue autorizada o rechazada y no puede ser modificada.');
        } else if (code === 'DISTRIBUIDORES.VALIDATION') {
          this.errorMessage.set('Faltan campos o el formato es incorrecto.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error al actualizar la solicitud');
        }
        this.isSubmitting.set(false);
      },
    });
  }
}
