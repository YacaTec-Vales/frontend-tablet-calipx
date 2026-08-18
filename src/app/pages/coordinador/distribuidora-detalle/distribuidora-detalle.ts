import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { DistribuidorResponse } from '../../../core/models/distribuidor.model';
import { CardComponent } from '../../../components/ui/card/card';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-distribuidora-detalle',
  imports: [CommonModule, RouterModule, CardComponent, BadgeComponent, ButtonComponent],
  templateUrl: './distribuidora-detalle.html'
})
export class DistribuidoraDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private distribuidoresService = inject(DistribuidoresService);

  distribuidora = signal<DistribuidorResponse | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDistribuidora(id);
    } else {
      this.errorMessage.set('ID de distribuidora no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadDistribuidora(id: string) {
    this.distribuidoresService.getById(id).subscribe({
      next: (res) => {
        this.distribuidora.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los detalles de la distribuidora.');
        this.isLoading.set(false);
      }
    });
  }

  solicitarAumento() {
    const d = this.distribuidora();
    if (d) {
      this.router.navigate(['/coordinador/solicitar-aumento', d.id]);
    }
  }

  verHistorialAumentos() {
    const d = this.distribuidora();
    if (d) {
      this.router.navigate(['/coordinador/seguimiento-aumento', d.id]);
    }
  }

  volver() {
    this.router.navigate(['/coordinador/distribuidoras']);
  }

  getBadgeVariant(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'ACTIVA': return 'success';
      case 'MOROSA': return 'warning';
      case 'DESHABILITADA': return 'error';
      case 'BAJA_VOLUNTARIA': return 'info';
      default: return 'info';
    }
  }
}
