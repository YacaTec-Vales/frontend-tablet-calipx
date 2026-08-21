import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { AuthService } from '../../../core/services/auth.service';
import { MfaService } from '../../../core/services/mfa.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-seguridad',
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900">Configuración de Seguridad</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Administra la autenticación de dos pasos (MFA).</p>
          </div>
          <div class="bg-gray-100 p-3 rounded-full">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>

        <div class="p-6">
          @if (alert()) {
          <div
            [class]="alert()?.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'"
            class="p-4 rounded-lg mb-6 text-sm border flex items-center gap-2"
          >
            @if (alert()?.type === 'error') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            @if (alert()?.type === 'success') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            {{ alert()?.message }}
          </div>
          }

          <!-- ESTADO: Desactivado -->
          @if (!isMfaEnabled() && step() === 'inactive') {
            <div class="flex flex-col md:flex-row gap-8 items-start">
              <div class="flex-1">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-4 border border-gray-200">
                  <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                  Inactivo
                </div>
                <h4 class="text-xl font-bold text-gray-900 mb-2">Protege tu cuenta</h4>
                <p class="text-gray-600 mb-6">
                  La autenticación de dos pasos añade una capa adicional de seguridad a tu cuenta. Además de tu contraseña, necesitarás un código generado por una aplicación en tu teléfono.
                </p>
                <app-button (click)="startSetup()" [disabled]="isLoading()">
                  Activar autenticación de dos pasos
                </app-button>
              </div>
              <div class="hidden md:block w-48 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
          }

          <!-- ESTADO: Configurando -->
          @if (step() === 'setup') {
            <div class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Paso 1 -->
                <div class="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span class="bg-brand text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">1</span>
                    Escanea el código QR
                  </h4>
                  <p class="text-sm text-gray-600 mb-4">Usa tu aplicación de autenticación (Google Authenticator, Authy, etc.) para escanear este código.</p>
                  <div class="bg-white p-4 rounded-lg inline-block border border-gray-200 shadow-sm">
                    @if (qrCodeUrl()) {
                      <img [src]="qrCodeUrl()" alt="QR Code" class="w-48 h-48" />
                    } @else {
                      <div class="w-48 h-48 bg-gray-100 animate-pulse flex items-center justify-center rounded">
                        <span class="text-gray-400">Generando...</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Paso 2 -->
                <div class="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col">
                  <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span class="bg-brand text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">2</span>
                    Códigos de respaldo
                  </h4>
                  <p class="text-sm text-gray-600 mb-4">Guarda estos códigos en un lugar seguro. Los necesitarás si pierdes acceso a tu aplicación.</p>
                  
                  <div class="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm grid grid-cols-2 gap-2 flex-1">
                    @for (code of backupCodes(); track code) {
                      <div class="text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-center tracking-wider">{{ code }}</div>
                    }
                  </div>
                </div>
              </div>

              <!-- Paso 3 -->
              <div class="border-t border-gray-200 pt-8 max-w-md mx-auto text-center">
                <h4 class="text-lg font-bold text-gray-900 mb-2">Verifica la configuración</h4>
                <p class="text-sm text-gray-600 mb-6">Ingresa el código de 6 dígitos generado por tu aplicación para activar el MFA.</p>
                
                <form (submit)="verifySetup($event)" class="space-y-4">
                  <div class="max-w-xs mx-auto">
                    <app-input
                      id="setupCode"
                      type="text"
                      placeholder="123456"
                      [maxlength]="6"
                      [(value)]="setupCode"
                    ></app-input>
                  </div>
                  
                  <div class="flex gap-3 justify-center pt-2">
                    <app-button type="button" variant="secondary" (click)="cancelSetup()" [disabled]="isLoading()">
                      Cancelar
                    </app-button>
                    <app-button type="submit" [disabled]="isLoading() || setupCode().length < 6">
                      Verificar y Activar
                    </app-button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- ESTADO: Activado -->
          @if (isMfaEnabled() && step() === 'active') {
            <div class="flex flex-col md:flex-row gap-8 items-start">
              <div class="flex-1">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4 border border-green-200">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  Activo
                </div>
                <h4 class="text-xl font-bold text-gray-900 mb-2">Cuenta Protegida</h4>
                <p class="text-gray-600 mb-6">
                  La autenticación de dos pasos está activa. Tu cuenta tiene una capa adicional de seguridad.
                </p>
                
                <div class="bg-red-50 border border-red-100 p-5 rounded-xl mt-8">
                  <h5 class="text-red-800 font-bold mb-2">Desactivar MFA</h5>
                  <p class="text-red-600 text-sm mb-4">Al desactivar el MFA reducirás la seguridad de tu cuenta.</p>
                  
                  @if (!showDisableForm()) {
                    <button type="button" class="text-red-700 bg-white border border-red-200 hover:bg-red-50 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors shadow-sm" (click)="showDisableForm.set(true)">
                      Desactivar autenticación de dos pasos
                    </button>
                  } @else {
                    <form (submit)="disableMfa($event)" class="bg-white p-4 rounded-lg border border-red-200">
                      <p class="text-sm text-gray-700 mb-3 font-medium">Ingresa un código actual para confirmar:</p>
                      <div class="flex gap-3">
                        <div class="flex-1">
                          <app-input
                            id="disableCode"
                            type="text"
                            placeholder="123456"
                            [maxlength]="6"
                            [(value)]="disableCode"
                          ></app-input>
                        </div>
                        <app-button type="submit" variant="primary" class="!bg-red-600 hover:!bg-red-700 !ring-red-300" [disabled]="isLoading() || disableCode().length < 6">
                          Confirmar
                        </app-button>
                      </div>
                      <button type="button" class="text-sm text-gray-500 hover:text-gray-700 mt-3" (click)="showDisableForm.set(false); disableCode.set(''); alert.set(null)">
                        Cancelar
                      </button>
                    </form>
                  }
                </div>
              </div>
              <div class="hidden md:block w-48 bg-green-50 rounded-xl p-4 border border-green-100">
                <svg class="w-full h-full text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Seguridad implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly mfaService = inject(MfaService);

  readonly isLoading = signal(false);
  readonly isMfaEnabled = signal(false);
  
  // 'inactive' | 'setup' | 'active'
  readonly step = signal<'inactive' | 'setup' | 'active'>('inactive');
  
  readonly qrCodeUrl = signal('');
  readonly backupCodes = signal<string[]>([]);
  readonly setupCode = signal('');
  
  readonly showDisableForm = signal(false);
  readonly disableCode = signal('');
  
  readonly alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.mfaEnabled) {
      this.isMfaEnabled.set(true);
      this.step.set('active');
    }
  }

  startSetup() {
    this.isLoading.set(true);
    this.alert.set(null);
    this.mfaService.setup().subscribe({
      next: async (response) => {
        try {
          const url = await QRCode.toDataURL(response.data.otpauthUrl);
          this.qrCodeUrl.set(url);
          this.backupCodes.set(response.data.backupCodes);
          this.step.set('setup');
        } catch (err) {
          this.alert.set({ type: 'error', message: 'Error generando el código QR.' });
        } finally {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.alert.set({ type: 'error', message: err.error?.message || 'Error iniciando la configuración.' });
      }
    });
  }

  cancelSetup() {
    this.step.set('inactive');
    this.setupCode.set('');
    this.qrCodeUrl.set('');
    this.backupCodes.set([]);
    this.alert.set(null);
  }

  verifySetup(event: Event) {
    event.preventDefault();
    if (this.setupCode().length < 6) return;
    
    this.isLoading.set(true);
    this.alert.set(null);
    
    this.mfaService.verifySetup(this.setupCode()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isMfaEnabled.set(true);
        this.step.set('active');
        this.alert.set({ type: 'success', message: '¡Autenticación de dos pasos activada exitosamente!' });
        this.setupCode.set('');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.alert.set({ type: 'error', message: err.error?.message || 'Código incorrecto. Intenta nuevamente.' });
      }
    });
  }

  disableMfa(event: Event) {
    event.preventDefault();
    if (this.disableCode().length < 6) return;
    
    this.isLoading.set(true);
    this.alert.set(null);
    
    this.mfaService.disable(this.disableCode()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isMfaEnabled.set(false);
        this.step.set('inactive');
        this.showDisableForm.set(false);
        this.disableCode.set('');
        this.alert.set({ type: 'success', message: 'Autenticación de dos pasos desactivada.' });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.alert.set({ type: 'error', message: err.error?.message || 'Código incorrecto. Intenta nuevamente.' });
      }
    });
  }
}
