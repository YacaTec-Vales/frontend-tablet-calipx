import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModule, BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LayoutModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private destroyed = new Subject<void>();

  readonly isValidResolution = signal(true);

  // Medidas ampliadas para soportar todas las Tablets (incluyendo iPad Pro y tablets Android grandes)
  private tabletQuery = '(min-width: 768px) and (max-width: 1366px)';

  ngOnInit(): void {
    // Intenta restaurar la sesion si hay un token almacenado
    this.authService.tryRestoreSession();

    // Si la variable de entorno está deshabilitada, siempre será válida la resolución (para desarrollo local)
    if (!environment.enforceTabletResolution) {
      this.isValidResolution.set(true);
      return;
    }

    // Check initial state
    this.isValidResolution.set(this.breakpointObserver.isMatched(this.tabletQuery));

    this.breakpointObserver
      .observe([this.tabletQuery])
      .pipe(takeUntil(this.destroyed))
      .subscribe((state) => {
        // Solo es valido si hace match con tablet
        this.isValidResolution.set(state.matches);
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
