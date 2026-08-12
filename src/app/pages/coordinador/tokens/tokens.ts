import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';

@Component({
  selector: 'app-tokens',
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './tokens.html'
})
export class Tokens implements OnDestroy {
  motivo = '';
  isGenerating = false;
  
  activeToken: string | null = null;
  timeLeft = 0; // segundos
  timerInterval?: ReturnType<typeof setInterval>;

  generarToken() {
    this.isGenerating = true;
    
    setTimeout(() => {
      // Generar token numérico de 6 dígitos
      this.activeToken = Math.floor(100000 + Math.random() * 900000).toString();
      this.timeLeft = 300; // 5 minutos de vigencia
      this.isGenerating = false;

      this.startTimer();
    }, 1000);
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.stopTimer();
        this.activeToken = null;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get formatTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  copiarToken() {
    if (this.activeToken) {
      navigator.clipboard.writeText(this.activeToken);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
