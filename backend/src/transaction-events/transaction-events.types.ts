export interface TransactionEventPayload {
  id: string;
  client: string;
  projectId: string;
  projectName: string;
  petEventCode: string;
  petEventDesc: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionEventsResponse = Record<string, TransactionEventPayload[]>;
