import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { validatePositiveAmount, validateReason } from '../../../core/validators/form-validators';

@Component({
  selector: 'app-solicitar-aumento',
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './solicitar-aumento.html'
})
export class SolicitarAumento implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private distribuidoresService = inject(DistribuidoresService);
  private destroyRef = inject(DestroyRef);

  distribuidoraId = signal<string>('');
  monto = signal<number | undefined>(undefined);
  motivo = signal<string>('');
  
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly montoError = computed(() => {
    if (!this.submitted()) return '';
    return validatePositiveAmount(this.monto(), 'monto', 10_000_000);
  });

  readonly motivoError = computed(() => {
    if (!this.submitted()) return '';
    return validateReason(this.motivo(), 10, 500, 'motivo');
  });

  readonly canSubmit = computed(() => {
    return !this.montoError() && !this.motivoError() && !!this.monto() && this.motivo().length >= 10 && !this.isSubmitting();
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.distribuidoraId.set(id);
    }
  }

  onSubmit() {
    this.submitted.set(true);
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const dto = {
      montoCentavos: this.monto()! * 100, // Convert to cents
      motivo: this.motivo()
    };

    this.distribuidoresService.createCreditRaiseRequest(this.distribuidoraId(), dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.successMessage.set('Solicitud de aumento enviada exitosamente a gerencia.');
        this.isSubmitting.set(false);
        // BUG FIX 2026-08-31: takeUntilDestroyed cancela el redirect si el
        // componente se destruye antes de los 2s.
        timer(2000)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.volver());
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al enviar la solicitud de aumento.');
        this.isSubmitting.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/coordinador/distribuidora-detalle', this.distribuidoraId()]);
  }
}
