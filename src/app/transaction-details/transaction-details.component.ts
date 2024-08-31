import { Component } from '@angular/core';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent {
  transactions: any[] = [];
  searchTransaction: string = '';

  constructor() { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    // this.transactionService.getTransactions().subscribe(data => {
    //   this.transactions = data;
    // });
  }

  applyFilterGlobal(event: any, mode: string): void {
    this.transactions = this.transactions.filter(transaction => transaction.TransactionId.includes(event.target.value));
  }

  addTransaction(): void {
    // Implement the add transaction logic
  }

  editTransaction(transaction: any): void {
    // Implement the edit transaction logic
  }

}
