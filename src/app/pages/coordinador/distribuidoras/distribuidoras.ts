import { Component, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistribuidoresService } from '../../../core/services/distribuidores.service';
import { AuthService } from '../../../core/services/auth.service';
import { CoordinadoresService } from '../../../core/services/coordinadores.service';
import { DistribuidorResponse } from '../../../core/models/distribuidor.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ButtonComponent } from '../../../components/ui/button/button';
import { PaginationComponent } from '../../../components/ui/pagination/pagination';

@Component({
  selector: 'app-distribuidoras',
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, PaginationComponent],
  templateUrl: './distribuidoras.html'
})
export class Distribuidoras implements OnInit, OnDestroy {
  private distribuidoresService = inject(DistribuidoresService);
  private authService = inject(AuthService);
  private coordinadoresService = inject(CoordinadoresService);
  private router = inject(Router);

  distribuidoras = signal<DistribuidorResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Filtros y Paginación
  searchQuery = signal('');
  statusFilter = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(5);
  totalItems = signal(0);
  
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  private pollingTimer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  constructor() {
    effect(() => {
      // Si cambia la pagina, el limit o el status, recargar de inmediato
      this.currentPage();
      this.itemsPerPage();
      this.statusFilter();
      this.loadDistribuidoras();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Inicialización si es necesaria, el effect ya dispara la primera carga por los signals
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage.set(1); // Reset page on new search
      this.loadDistribuidoras();
    }, 500);
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

    this.coordinadoresService.listarDistribuidoras(user.id, {
      status: this.statusFilter() || undefined,
      search: this.searchQuery() || undefined,
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      sortOrder: 'desc'
    }).subscribe({
      next: (res) => {
        this.distribuidoras.set(res.data?.data || []);
        this.totalItems.set(res.data?.meta?.total || 0);
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
