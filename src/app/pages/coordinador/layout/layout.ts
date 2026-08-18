import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { LayoutModule, BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-coordinador-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LayoutModule, NgOptimizedImage],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy {
  isSidebarOpen = true;
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Subject para limpiar la suscripción
  private destroyed = new Subject<void>();
  
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = false;

  // Medidas exactas basadas en Tailwind CSS
  private mobileQuery = '(max-width: 767px)';
  private tabletQuery = '(min-width: 768px) and (max-width: 1023px)';
  private desktopQuery = '(min-width: 1024px)';

  ngOnInit() {
    this.breakpointObserver
      .observe([this.mobileQuery, this.tabletQuery, this.desktopQuery])
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        this.isMobile = this.breakpointObserver.isMatched(this.mobileQuery);
        this.isTablet = this.breakpointObserver.isMatched(this.tabletQuery);
        this.isDesktop = this.breakpointObserver.isMatched(this.desktopQuery);

        this.validarProporciones();
      });
  }

  validarProporciones() {
    if (this.isMobile || this.isTablet) {
      // Ocultar sidebar por defecto en mobile y tablet
      this.isSidebarOpen = false;
    } else if (this.isDesktop) {
      // Mostrar sidebar por defecto en desktop
      this.isSidebarOpen = true;
    }
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
