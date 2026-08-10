import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'file' | 'date' = 'text';
  @Input() placeholder: string = '';
  @Input() id: string = `input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() disabled: boolean = false;
  @Input() rows: number = 4; // Solo para textarea
  @Input() hint: string = '';

  /** Permite binding directo con [value] */
  @Input() value: string = '';

  /** Emite el valor como string cuando cambia (para usar con (valueChange)) */
  @Output() valueChange = new EventEmitter<string>();

  fileName: string = '';

  onChange: any = () => { };
  onTouch: any = () => { };

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = inputElement.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouch();
  }

  onFileChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.fileName = fileInput.files[0].name;
      // Emitimos el objeto file en este caso
      this.onChange(fileInput.files[0]);
    } else {
      this.fileName = '';
      this.onChange(null);
    }
    this.onTouch();
  }
}
