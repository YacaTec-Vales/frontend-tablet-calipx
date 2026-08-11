import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-coordinador-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  isSidebarOpen = true;
  private readonly authService = inject(AuthService);

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
