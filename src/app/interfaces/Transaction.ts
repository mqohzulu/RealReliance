export interface Transaction {
  transactionId: string;
  accountId: string;
  accountNumber: string ;
  amount: number;
  description: string;
  transactionType: 'Transfer' | 'Credit' | 'Debit';
  transactionDate: Date;
}
