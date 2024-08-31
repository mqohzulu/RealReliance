import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiAccountsService } from 'src/app/services/api-accounts.service';
import { ApiTransactionsService } from 'src/app/services/api-transactions.service';

@Component({
  selector: 'app-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.css']
})
export class TransactionDialogComponent {
  editDialogVisible: boolean = false;
  public maxDate: Date = new Date();
  editingTransaction: any = {};

  public transactionTypes: any[] = [
    { label: 'Credit', value: 'Credit' },
    { label: 'Debit', value: 'Debit' }
  ];
  public accounts: any[] = [];
  AccountTo: any;
  date: Date = new Date;


  constructor(private apiTransactions: ApiTransactionsService,
    private apiAccounts: ApiAccountsService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public messageService: MessageService
  ) { }

  ngOnInit() {
    this.editingTransaction = { ...this.config.data };
    console.log("🚀 ~ TransactionDialogComponent ~ ngOnInit ~ this.editingTransaction :", this.editingTransaction)
    this.date = new Date(this.editingTransaction.transactionDate)

    this.maxDate = new Date();
    this.getAccounts();
  }

  saveTransaction() {
    const command: any = {
      AccountFrom: this.editingTransaction.accountNumber,
      AccountTo: this.AccountTo,
      Amount: parseFloat(this.editingTransaction.amount), 
      description: this.editingTransaction.description
    };
    this.apiTransactions.transfer(command).subscribe({
      next: (data: any) => {
        this.messageService.add({ severity: 'success', detail: 'Transfer successful' });
        this.ref.close();
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', detail: error.error });
      }
    });
  }
  getAccounts() {
    this.apiAccounts.getAccounts(true).subscribe({
      next: (data: any[]) => {
        this.accounts = data;
        console.log("🚀 ~ TransactionDialogComponent ~ this.apiAccounts.getAccounts ~  this.accounts:", this.accounts)
      }
    })
  }

  hideDialog() {
    this.ref.close();
  }

}
