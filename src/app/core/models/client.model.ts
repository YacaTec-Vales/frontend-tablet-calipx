export interface TransferClientDto {
  newDistributorId: string;
  reason: string;
  notes?: string;
}

export interface ClientTransferResponse {
  id: string;
  previousDistributorId: string;
  newDistributorId: string;
}
