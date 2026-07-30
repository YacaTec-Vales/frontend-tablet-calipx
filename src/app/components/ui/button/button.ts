import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() onClick = new EventEmitter<Event>();

  get classes(): string {
    const base = 'font-bold rounded-lg focus:ring-4 focus:outline-none transition-all flex items-center justify-center gap-2';
    const widthClass = this.fullWidth ? 'w-full' : '';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md';
    
    let variantClass = '';
    switch (this.variant) {
      case 'primary':
        // Primary is Guindo (#600C0C) using standard text-white
        variantClass = 'text-white bg-brand hover:bg-brand-strong focus:ring-brand-300';
        break;
      case 'secondary':
        variantClass = 'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-gray-100';
        break;
      case 'outline':
        variantClass = 'text-brand bg-transparent border-2 border-brand hover:bg-brand-50 focus:ring-brand-200';
        break;
      case 'error':
        variantClass = 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-300';
        break;
    }

    let sizeClass = '';
    switch (this.size) {
      case 'sm':
        sizeClass = 'px-3 py-2 text-sm';
        break;
      case 'md':
        sizeClass = 'px-5 py-2.5 text-base';
        break;
      case 'lg':
        sizeClass = 'px-5 py-3 text-lg';
        break;
    }

    return `${base} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass}`;
  }

  handleClick(event: Event) {
    if (!this.disabled) {
      this.onClick.emit(event);
    }
  }
}
