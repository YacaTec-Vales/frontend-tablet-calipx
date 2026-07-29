import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  error: string = '';

  constructor(private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.email === 'verificador@empresa.com') {
      this.router.navigate(['/verificador']);
    } else if (this.email === 'admin@empresa.com') {
      this.router.navigate(['/admin']);
    } else {
      this.error = 'Usuario no reconocido. Usa verificador@empresa.com o admin@empresa.com';
    }
  }
}
