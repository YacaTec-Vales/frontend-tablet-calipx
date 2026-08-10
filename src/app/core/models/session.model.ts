/** Sesion activa del usuario */
export interface Session {
  id: string;
  device?: string;
  ip?: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}
