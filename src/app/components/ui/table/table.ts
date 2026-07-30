import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.html'
})
export class TableComponent {
  @Input() columns: string[] = [];
  @Input() emptyMessage: string = 'No hay registros disponibles.';
  @Input() isEmpty: boolean = false;
}
