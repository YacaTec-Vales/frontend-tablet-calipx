import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedUsersResponseDto, UserResponseDto } from '../models/user.model';
import { UserRole } from '../models/auth.model';

export interface UserFilters {
  page?: number;
  limit?: number;
  roleCode?: UserRole;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  list(filters?: UserFilters): Observable<ApiResponse<PaginatedUsersResponseDto>> {
    let params = new HttpParams();

    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.roleCode) params = params.set('roleCode', filters.roleCode);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<PaginatedUsersResponseDto>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<UserResponseDto>> {
    return this.http.get<ApiResponse<UserResponseDto>>(`${this.apiUrl}/${id}`);
  }
}
