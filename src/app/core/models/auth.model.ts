/** Request body para POST /auth/login */
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

/** Respuesta de login y refresh (dentro de data del envelope) */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginResponseDto {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  mfaRequired?: boolean;
  mfaToken?: string;
}

/** Usuario autenticado devuelto por GET /auth/me y login */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  roleCode?: UserRole;
  branchId?: string;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  permissions: string[];
}

/** Roles posibles en la tablet */
export type UserRole =
  | 'COORDINADOR'
  | 'VERIFICADOR'
  | 'GERENTE_GENERAL'
  | 'GERENTE_SUCURSAL'
  | 'ADMINISTRADOR'
  | 'DISTRIBUIDOR'
  | 'CAJERO';

/** Request body para POST /auth/refresh */
export interface RefreshRequest {
  refreshToken: string;
}

/** Request body para POST /auth/change-password */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Request body para POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** Request body para POST /auth/reset-password */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
