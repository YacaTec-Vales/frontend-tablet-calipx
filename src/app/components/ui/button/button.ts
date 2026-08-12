import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.html',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly onClick = output<Event>();

  readonly classes = computed(() => {
    const base = 'font-medium rounded-lg focus:outline-none transition-all flex items-center justify-center gap-2';
    const widthClass = this.fullWidth() ? 'w-full' : '';
    const disabledClass = (this.disabled() || this.isLoading()) ? 'opacity-50 cursor-not-allowed' : 'shadow-sm hover:shadow-md';

    let variantClass = '';
    switch (this.variant()) {
      case 'primary':
        variantClass = 'text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800';
        break;
      case 'secondary':
        variantClass = 'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700';
        break;
      case 'outline':
        variantClass = 'text-primary-700 bg-transparent border border-primary-700 hover:bg-primary-800 hover:text-white focus:ring-4 focus:ring-primary-300 dark:border-primary-500 dark:text-primary-500 dark:hover:text-white dark:hover:bg-primary-500 dark:focus:ring-primary-800';
        break;
      case 'error':
        variantClass = 'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900';
        break;
    }

    let sizeClass = '';
    switch (this.size()) {
      case 'sm':
        sizeClass = 'px-3 py-2 text-sm min-h-[36px]';
        break;
      case 'md':
        sizeClass = 'px-5 py-2.5 text-base min-h-[44px]'; // Tablet standard 44px
        break;
      case 'lg':
        sizeClass = 'px-5 py-3 text-lg min-h-[48px]';
        break;
    }

    return `${base} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass}`;
  });

  handleClick(event: Event) {
    if (!this.disabled() && !this.isLoading()) {
      this.onClick.emit(event);
    }
  }
}
