/** Respuesta de GET /distribuidores/:id */
export interface DistribuidorResponse {
  id: string;
  numero_distribuidora: string;
  usuario_id: string;
  categoria_id: string;
  branch_id: string;
  coordinador_id: string;
  limite_credito_centavos: number;
  estado: 'ACTIVA' | 'MOROSA' | 'DESHABILITADA' | 'BAJA_VOLUNTARIA';
  created_at: string;
  updated_at: string;
}

/** Request body para POST /distribuidores/:id/credit/increment */
export interface CreditIncrementRequest {
  monto_centavos: number;
  comentarios?: string;
}
