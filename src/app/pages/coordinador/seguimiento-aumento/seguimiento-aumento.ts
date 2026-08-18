import { Component, signal, inject, OnInit } from '@angular/core';
import { CreditRaiseRequest } from '../../../core/models/distribuidor.model';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { CreditRaiseService } from '../../../core/services/credit-raise.service';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-seguimiento-aumento',
  imports: [CommonModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, DatePipe],
  templateUrl: './seguimiento-aumento.html'
})
export class SeguimientoAumento implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private distribuidoresService = inject(DistribuidoresService);
  private creditRaiseService = inject(CreditRaiseService);
  private location = inject(Location);

  distribuidoraId = signal<string>('');
  requests = signal<CreditRaiseRequest[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.distribuidoraId.set(id);
      this.loadRequests(id);
    } else {
      this.errorMessage.set('ID de distribuidora no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadRequests(id: string) {
    this.distribuidoresService.getRaiseRequests(id).subscribe({
      next: (res) => {
        this.requests.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el historial de aumentos.');
        this.isLoading.set(false);
      }
    });
  }

  volver() {
    this.location.back();
  }

  getBadgeVariant(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'info';
    }
  }
}
