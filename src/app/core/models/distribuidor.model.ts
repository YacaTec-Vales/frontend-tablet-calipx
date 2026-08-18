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
  generalData?: Record<string, unknown>;
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

export interface CreditRaiseRequest {
  id: string;
  distributorId: string;
  branchId: string;
  fromCreditLimitCents: number;
  requestedAmountCents: number;
  approvedAmountCents: number | null;
  toCreditLimitCents: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedBy: string;
  decidedBy: string | null;
  reason: string;
  decisionNotes: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface DecideCreditRaiseDto {
  montoCentavos?: number;
  notas?: string;
}
