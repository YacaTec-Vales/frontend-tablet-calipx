import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
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
export class Distribuidoras implements OnInit, OnDestroy {
  private coordinadoresService = inject(CoordinadoresService);
  private authService = inject(AuthService);
  private router = inject(Router);

  distribuidoras = signal<DistribuidorResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit() {
    this.loadDistribuidoras();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  loadDistribuidoras(isBackground = false) {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage.set('No hay sesión activa.');
      if (!isBackground) this.isLoading.set(false);
      return;
    }

    if (!isBackground) {
      this.isLoading.set(true);
    }

    this.coordinadoresService.listarDistribuidoras(user.id).subscribe({
      next: (res) => {
        this.distribuidoras.set(res.data?.data || []);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: () => {
        if (!isBackground) {
          this.errorMessage.set('Error al cargar las distribuidoras.');
          this.isLoading.set(false);
        }
        this.scheduleNextPoll();
      }
    });
  }

  private scheduleNextPoll() {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.loadDistribuidoras(true);
    }, 15000);
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
