import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { CoordinadoresService } from '../../../core/services/coordinadores.service';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { CreditRaiseService } from '../../../core/services/credit-raise.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreditRaiseRequest } from '../../../core/models/distribuidor.model';
import { InputComponent } from '../../../components/ui/input/input';

interface Candidata {
  id: string;
  nombre: string;
  limiteActual: number;
  valesPagados: number;
  puntaje: string;
}

@Component({
  selector: 'app-incentivos',
  imports: [CommonModule, ReactiveFormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, InputComponent],
  templateUrl: './incentivos.html'
})
export class Incentivos implements OnInit {
  private coordinadoresService = inject(CoordinadoresService);
  private distribuidoresService = inject(DistribuidoresService);
  private creditRaiseService = inject(CreditRaiseService);
  private authService = inject(AuthService);

  candidatas = signal<Candidata[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedCandidata: Candidata | null = null;
  isSending = signal(false);
  requestSent = signal(false);
  isLoadingRequests = signal(false);
  solicitudDetalle = signal<any | null>(null);
  formError = signal<string | null>(null);

  form: FormGroup | null = null;

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
        const candidatasMap = d.map((dist: any) => ({
          id: dist.id,
          nombre: `Distribuidora ${dist.distributorNumber}`,
          limiteActual: (dist.creditLimitCents || 0) / 100,
          valesPagados: 0, // Mocked
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
    this.requestSent.set(false);
    this.isLoadingRequests.set(true);
    this.solicitudDetalle.set(null);
    this.formError.set(null);

    this.distribuidoresService.getRaiseRequests(candidata.id).subscribe({
      next: (res) => {
        const requests = res.data || [];
        const pendingReq = requests.find((r: any) => r.status === 'PENDING');
        
        if (pendingReq) {
          this.solicitudDetalle.set(pendingReq);
        } else {
          this.form = new FormGroup({
            monto: new FormControl(Math.round(candidata.limiteActual * 0.20), [Validators.required, Validators.min(1), Validators.max(10000000000)]),
            motivo: new FormControl('Buen comportamiento de pago y aumento de cartera', [Validators.required, Validators.maxLength(500)])
          });
        }
        this.isLoadingRequests.set(false);
      },
      error: () => {
        this.isLoadingRequests.set(false);
      }
    });
  }

  volverLista() {
    this.selectedCandidata = null;
  }

  preAutorizarAumento() {
    if (!this.form || this.form.invalid || !this.selectedCandidata) return;

    this.isSending.set(true);
    this.formError.set(null);

    const dto = {
      montoCentavos: this.form.value.monto * 100,
      motivo: this.form.value.motivo
    };

    this.distribuidoresService.createCreditRaiseRequest(this.selectedCandidata.id, dto).subscribe({
      next: () => {
        this.isSending.set(false);
        this.requestSent.set(true);
      },
      error: (err) => {
        this.isSending.set(false);
        let msg = 'Error al solicitar el aumento. Intenta de nuevo.';
        
        // El backend de NestJS a veces manda los detalles en err.error.error.details.violations
        if (err.error?.error?.details?.violations?.length) {
          msg = err.error.error.details.violations[0];
        } else if (err.error?.message) {
          msg = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
        }
        
        this.formError.set(msg);
      }
    });
  }
}
