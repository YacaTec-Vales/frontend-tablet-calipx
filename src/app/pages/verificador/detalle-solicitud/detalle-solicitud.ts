import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../components/ui/button/button';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudResponse } from '../../../core/models/solicitud.model';
import { CardComponent } from '../../../components/ui/card/card';

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

  readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly isStarting = signal(false);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly currentTab = signal<'GENERALES' | 'DOMICILIO' | 'VEHICULOS' | 'LABORALES' | 'CREDITOS' | 'FAMILIARES'>('GENERALES');

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
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar la solicitud');
        this.isLoading.set(false);
      }
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
