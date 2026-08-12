import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  templateUrl: './table.html'
})
export class TableComponent {
  readonly columns = input<string[]>([]);
  readonly emptyMessage = input<string>('No hay registros disponibles.');
  readonly isEmpty = input<boolean>(false);
}
