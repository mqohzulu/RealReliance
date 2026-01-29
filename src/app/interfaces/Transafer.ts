export interface TransferFundsCommand {
    AccountFrom: string | undefined; 
    AccountTo: string;
    Amount: number; 
    description: string;
  }

export interface UpdateTransactionCommand {
  transactionId: string;
  accountId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  transactionType: string;
}

export interface CreateTransactionCommand {
  accountId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  transactionType: string;
}
