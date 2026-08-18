import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';

@Component({
  selector: 'app-solicitar-aumento',
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './solicitar-aumento.html'
})
export class SolicitarAumento implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private distribuidoresService = inject(DistribuidoresService);

  distribuidoraId = signal<string>('');
  monto = signal<number | undefined>(undefined);
  motivo = signal<string>('');
  
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.distribuidoraId.set(id);
    }
  }

  get canSubmit(): boolean {
    return !!this.monto() && this.monto()! > 0 && this.motivo().length >= 10 && !this.isSubmitting();
  }

  onSubmit() {
    if (!this.canSubmit) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const dto = {
      montoCentavos: this.monto()! * 100, // Convert to cents
      motivo: this.motivo()
    };

    this.distribuidoresService.createCreditRaiseRequest(this.distribuidoraId(), dto).subscribe({
      next: () => {
        this.successMessage.set('Solicitud de aumento enviada exitosamente a gerencia.');
        this.isSubmitting.set(false);
        setTimeout(() => this.volver(), 2000);
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
