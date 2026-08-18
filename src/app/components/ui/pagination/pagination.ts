import { Component, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-2">
        <span>Mostrar</span>
        <select 
          [ngModel]="itemsPerPage()" 
          (ngModelChange)="onItemsPerPageChange($event)" 
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="25">25</option>
          <option [value]="50">50</option>
        </select>
        <span>registros</span>
      </div>
      <div>
        Mostrando {{ totalItems() === 0 ? 0 : startIndex() + 1 }} a {{ endIndex() }} de {{ totalItems() }}
      </div>
      <div class="flex gap-1">
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage() === 1 || totalItems() === 0" 
          class="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Anterior
        </button>
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage() === totalPages() || totalItems() === 0" 
          class="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Siguiente
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  readonly totalItems = model.required<number>();
  readonly itemsPerPage = model(10);
  readonly currentPage = model(1);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.itemsPerPage())));
  readonly startIndex = computed(() => (this.currentPage() - 1) * this.itemsPerPage());
  readonly endIndex = computed(() => Math.min(this.startIndex() + this.itemsPerPage(), this.totalItems()));

  onItemsPerPageChange(value: string | number) {
    this.itemsPerPage.set(Number(value));
    // Reset to first page when changing page size
    this.currentPage.set(1);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
}
