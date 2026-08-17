import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CoordinadoresService } from '../../../core/services/coordinadores.service';
import { AuthService } from '../../../core/services/auth.service';
import { DistribuidorResponse } from '../../../core/models/distribuidor.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-distribuidoras',
  imports: [CommonModule, RouterModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent],
  templateUrl: './distribuidoras.html'
})
export class Distribuidoras implements OnInit {
  private coordinadoresService = inject(CoordinadoresService);
  private authService = inject(AuthService);
  private router = inject(Router);

  distribuidoras = signal<DistribuidorResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadDistribuidoras();
  }

  loadDistribuidoras() {
    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage.set('No hay sesión activa.');
      this.isLoading.set(false);
      return;
    }

    this.coordinadoresService.listarDistribuidoras(user.id).subscribe({
      next: (res) => {
        this.distribuidoras.set(res.data?.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar las distribuidoras.');
        this.isLoading.set(false);
      }
    });
  }

  verDetalle(id: string) {
    this.router.navigate(['/coordinador/distribuidora-detalle', id]);
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
