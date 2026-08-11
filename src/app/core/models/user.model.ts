import { UserRole } from './auth.model';

export interface UserResponseDto {
  id: string;
  roleCode: UserRole;
  branchId?: string;
  firstName?: string;
  lastNamePaternal?: string;
  lastNameMaternal?: string;
  email: string;
  phone?: string;
  username: string;
  userStatus: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  isActive: boolean;
  mustChangePassword?: boolean;
  mfaEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedUsersResponseDto {
  data: UserResponseDto[];
  meta: PaginationMetaDto;
}
