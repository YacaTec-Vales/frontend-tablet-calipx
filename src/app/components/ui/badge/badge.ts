import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html'
})
export class BadgeComponent {
  @Input() text: string = '';
  @Input() variant: BadgeVariant = 'default';

  get classes(): string {
    const base = 'text-xs font-bold px-2.5 py-0.5 rounded border inline-flex items-center justify-center';
    
    switch (this.variant) {
      case 'success':
        return `${base} bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800`;
      case 'error':
        return `${base} bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800`;
      case 'warning':
        return `${base} bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800`;
      case 'info':
        return `${base} bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800`;
      case 'default':
      default:
        return `${base} bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`;
    }
  }
}
