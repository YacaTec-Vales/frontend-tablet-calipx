import { Component, input, output, forwardRef, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
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
  readonly label = input<string>('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'textarea' | 'file' | 'date' | 'tel'>('text');
  readonly placeholder = input<string>('');
  readonly id = input<string>(`input-${Math.random().toString(36).substring(2, 9)}`);
  readonly disabled = input<boolean>(false);
  readonly rows = input<number>(4); // Solo para textarea
  readonly hint = input<string>('');
  readonly maxlength = input<number | string | undefined>();
  readonly inputmode = input<string | undefined>();
  readonly isInvalid = input<boolean>(false);
  readonly errorMessage = input<string>('');

  /** Permite binding directo con [value] */
  readonly value = model<string>('');

  fileName: string = '';

  onChange: (val: unknown) => void = () => { };
  onTouch: () => void = () => { };

  writeValue(val: unknown): void {
    this.value.set(typeof val === 'string' ? val : '');
  }

  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Cannot mutate a read-only input, typically forms disable logic is handled via CVA, 
    // but mixing CVA and standard inputs requires care. We'll ignore it as the parent form handles it.
  }

  onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(inputElement.value);
    this.onChange(this.value());
    this.onTouch();
  }

  onKeyPress(event: KeyboardEvent) {
    if (this.type() === 'number') {
      // Prevenir 'e', '+', '-', '.' si queremos numeros puros
      if (['e', 'E', '+', '-', '.'].includes(event.key)) {
        event.preventDefault();
      }
    }
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
