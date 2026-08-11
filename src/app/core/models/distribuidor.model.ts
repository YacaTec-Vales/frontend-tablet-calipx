/** Respuesta de GET /distribuidores/:id */
export interface DistribuidorResponse {
  id: string;
  distributorNumber: string;
  userId: string;
  categoryId: string;
  branchId: string;
  coordinatorId: string;
  creditLimitCents: number;
  creditAvailableCents: number;
  status: 'ACTIVA' | 'MOROSA' | 'DESHABILITADA' | 'BAJA_VOLUNTARIA';
  createdAt: string;
  updatedAt: string;
}

/** Request body para POST /distribuidores/:id/credit/increment */
export interface CreditIncrementRequest {
  montoCentavos: number;
  comentarios?: string;
}

/** Request body para POST /distribuidores/:id/credit-raise-requests */
export interface CreateCreditRaiseDto {
  montoCentavos: number;
  motivo: string;
}
