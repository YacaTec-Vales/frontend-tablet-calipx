import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
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
import { Router } from '@angular/router';

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
export class Incentivos implements OnInit, OnDestroy {
  private coordinadoresService = inject(CoordinadoresService);
  private distribuidoresService = inject(DistribuidoresService);
  private creditRaiseService = inject(CreditRaiseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  candidatas = signal<Candidata[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedCandidata: Candidata | null = null;
  isSending = signal(false);
  requestSent = signal(false);
  isLoadingRequests = signal(false);
  solicitudDetalle = signal<CreditRaiseRequest | null>(null);
  lastRejectedRequest = signal<CreditRaiseRequest | null>(null);
  formError = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly currentFilter = signal<string>('');

  readonly filteredCandidatas = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();
    const filter = this.currentFilter();
    let all = this.candidatas();

    if (filter) {
      all = all.filter(c => c.puntaje === filter);
    }

    if (search) {
      all = all.filter(c => {
        const text = `${c.id} ${c.nombre}`.toLowerCase();
        return text.includes(search);
      });
    }

    return all;
  });

  form: FormGroup | null = null;

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  ngOnInit() {
    this.cargarDistribuidoras();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
  }

  cargarDistribuidoras(isBackground = false) {
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
      this.errorMessage.set(null);
    }

    this.coordinadoresService.listarDistribuidoras(user.id).subscribe({
      next: (res) => {
        const d = res.data?.data || [];
        const mapStatusToPuntaje = (status: string) => {
          switch (status) {
            case 'ACTIVA': return 'Excelente';
            case 'MOROSA': return 'Con Atrasos';
            case 'DESHABILITADA': return 'Deshabilitada';
            case 'BAJA_VOLUNTARIA': return 'Baja Voluntaria';
            default: return 'Desconocido';
          }
        };

        const candidatasMap = d.map((dist: { id: string; distributorNumber: string; creditLimitCents?: number; status: string }) => ({
          id: dist.id,
          nombre: `Distribuidora ${dist.distributorNumber}`,
          limiteActual: (dist.creditLimitCents || 0) / 100,
          valesPagados: 0, // Mocked
          puntaje: mapStatusToPuntaje(dist.status)
        }));
        this.candidatas.set(candidatasMap);
        if (!isBackground) this.isLoading.set(false);
        this.scheduleNextPoll();
      },
      error: (err) => {
        if (!isBackground) {
          this.errorMessage.set('Error al cargar las distribuidoras candidatas.');
          this.isLoading.set(false);
        }
        this.scheduleNextPoll();
      }
    });
  }

  private scheduleNextPoll() {
    if (this.isDestroyed) return;
    this.pollingTimer = setTimeout(() => {
      this.cargarDistribuidoras(true);
    }, 15000);
  }

  seleccionar(candidata: Candidata) {
    this.selectedCandidata = candidata;
    this.requestSent.set(false);
    this.isLoadingRequests.set(true);
    this.solicitudDetalle.set(null);
    this.lastRejectedRequest.set(null);
    this.formError.set(null);

    this.distribuidoresService.getRaiseRequests(candidata.id).subscribe({
      next: (res) => {
        const requests = res.data || [];
        const pendingReq = requests.find((r: CreditRaiseRequest) => r.status === 'PENDING');
        
        // Buscar la solicitud rechazada más reciente
        const rejectedReqs = requests.filter((r: CreditRaiseRequest) => r.status === 'REJECTED');
        if (rejectedReqs.length > 0) {
          const lastRejected = rejectedReqs.sort((a: CreditRaiseRequest, b: CreditRaiseRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          this.lastRejectedRequest.set(lastRejected);
        }
        
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

  verHistorialPeticiones(id: string) {
    this.router.navigate(['/coordinador/seguimiento-aumento', id]);
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

  getBadgeVariant(puntaje: string): 'success' | 'warning' | 'error' | 'info' {
    switch (puntaje) {
      case 'Excelente': return 'success';
      case 'Con Atrasos': return 'error';
      case 'Deshabilitada': return 'error';
      case 'Baja Voluntaria': return 'warning';
      default: return 'info';
    }
  }
}
