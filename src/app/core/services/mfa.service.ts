import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

export interface MfaSetupResponse {
  otpauthUrl: string;
  backupCodes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MfaService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/mfa`;

  setup(): Observable<ApiResponse<MfaSetupResponse>> {
    return this.http.post<ApiResponse<MfaSetupResponse>>(`${this.apiUrl}/setup`, {});
  }

  verifySetup(code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/verify-setup`, { code }).pipe(
      tap(() => {
        const user = this.authService.currentUser();
        if (user) {
          this.authService.updateCurrentUser({ ...user, mfaEnabled: true });
        }
      })
    );
  }

  disable(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disable`, { body: { code } }).pipe(
      tap(() => {
        const user = this.authService.currentUser();
        if (user) {
          this.authService.updateCurrentUser({ ...user, mfaEnabled: false });
        }
      })
    );
  }

  adminDisable(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin-disable/${userId}`);
  }
}
