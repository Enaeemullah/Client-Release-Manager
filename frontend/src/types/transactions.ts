export interface TransactionEvent {
  id: string;
  client: string;
  projectId: string;
  projectName: string;
  petEventCode: string;
  petEventDesc: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionEventsByClient = Record<string, TransactionEvent[]>;

export interface TransactionEventInput {
  client: string;
  petEventCode: string;
  petEventDesc: string;
}
