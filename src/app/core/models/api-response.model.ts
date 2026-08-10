/** Envelope estandar de respuesta exitosa del backend */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/** Envelope estandar de error del backend */
export interface ApiErrorResponse {
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
}

/** Respuesta de health checks (formato Terminus, NO usa envelope estandar) */
export interface HealthResponse {
  status: 'ok' | 'error';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; message?: string }>;
  details?: Record<string, { status: string }>;
}
