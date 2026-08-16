import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CoordinadoresService } from '../../../core/services/coordinadores.service';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { AuthService } from '../../../core/services/auth.service';
import { inject, signal, OnInit } from '@angular/core';

interface Candidata {
  id: string;
  nombre: string;
  limiteActual: number;
  valesPagados: number;
  puntaje: string;
}

@Component({
  selector: 'app-incentivos',
  imports: [CommonModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent],
  templateUrl: './incentivos.html'
})
export class Incentivos implements OnInit {
  private coordinadoresService = inject(CoordinadoresService);
  private distribuidoresService = inject(DistribuidoresService);
  private authService = inject(AuthService);

  candidatas = signal<Candidata[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedCandidata: Candidata | null = null;
  isSending = false;
  requestSent = false;

  ngOnInit() {
    this.cargarDistribuidoras();
  }

  cargarDistribuidoras() {
    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage.set('No hay sesión activa.');
      this.isLoading.set(false);
      return;
    }

    this.coordinadoresService.listarDistribuidoras(user.id).subscribe({
      next: (res) => {
        const d = res.data?.data || [];
        // Map to Candidata format
        const candidatasMap = d.map(dist => ({
          id: dist.id,
          nombre: `Distribuidora ${dist.distributorNumber}`,
          limiteActual: (dist.creditLimitCents || 0) / 100,
          valesPagados: 0, // Mocked, backend doesn't provide this yet
          puntaje: dist.status === 'ACTIVA' ? 'Excelente' : 'Bueno'
        }));
        this.candidatas.set(candidatasMap);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar las distribuidoras candidatas.');
        this.isLoading.set(false);
      }
    });
  }

  seleccionar(candidata: Candidata) {
    this.selectedCandidata = candidata;
    this.requestSent = false;
  }

  volverLista() {
    this.selectedCandidata = null;
  }

  preAutorizarAumento() {
    if (!this.selectedCandidata) return;

    this.isSending = true;
    const dto = {
      montoCentavos: (this.selectedCandidata.limiteActual * 1.20) * 100,
      motivo: 'Buen historial de crédito'
    };

    this.distribuidoresService.createCreditRaiseRequest(this.selectedCandidata.id, dto).subscribe({
      next: () => {
        this.isSending = false;
        this.requestSent = true;
      },
      error: () => {
        this.isSending = false;
        // Optionally handle error UI here
      }
    });
  }
}
