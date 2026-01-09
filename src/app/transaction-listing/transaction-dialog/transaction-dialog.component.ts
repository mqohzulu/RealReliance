import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiAccountsService } from 'src/app/services/api-accounts.service';
import { ApiTransactionsService } from 'src/app/services/api-transactions.service';
import { ApiPersonService } from 'src/app/services/api-person.service';

@Component({
  selector: 'app-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.css']
})
export class TransactionDialogComponent implements OnInit {
  editDialogVisible: boolean = false;
  public maxDate: Date = new Date();
  editingTransaction: any = {};
  isEditMode: boolean = false;

  public persons: any[] = [];
  public accounts: any[] = [];
  public selectedPersonAccounts: any[] = [];
  
  selectedPerson: any = null;
  selectedAccount: any = null;
  date: Date = new Date();

  constructor(
    private apiTransactions: ApiTransactionsService,
    private apiAccounts: ApiAccountsService,
    private apiPerson: ApiPersonService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public messageService: MessageService
  ) { }

  ngOnInit() {
    this.editingTransaction = this.config.data ? { ...this.config.data } : {
      transactionId: '',
      accountId: '',
      accountNumber: '',
      amount: 0,
      description: '',
      transactionType: 'Transfer',
      transactionDate: new Date()
    };
    
    this.isEditMode = !!this.editingTransaction.transactionId && this.editingTransaction.transactionId !== '';
    
    if (this.editingTransaction.transactionDate) {
      this.date = new Date(this.editingTransaction.transactionDate);
    } else {
      this.date = new Date();
    }

    this.maxDate = new Date();
    this.getPersons();
  }

  getPersons() {
    this.apiPerson.getPersonsList(true).subscribe({
      next: (data: any[]) => {
        this.persons = data
          .filter(person => person.personID !== this.config.data?.personId) // Exclude current person if available
          .map(person => ({
            ...person,
            displayName: `${person.firstName} ${person.lastName} (${person.idNumber})`
          }));
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load persons' 
        });
      }
    });
  }

  onPersonChange(event: any) {
    if (event.value) {
      this.selectedPersonAccounts = event.value.accounts?.filter(
        (account: any) => account.activeInd === true && account.status === false
      ) || [];
      
      this.selectedAccount = null; // Reset selected account
      
      if (this.selectedPersonAccounts.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'No Available Accounts',
          detail: 'This person has no open accounts available for transfer'
        });
      }
    } else {
      this.selectedPersonAccounts = [];
      this.selectedAccount = null;
    }
  }

  saveTransaction() {
    if (!this.selectedPerson) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please select a recipient person' 
      });
      return;
    }

    if (!this.selectedAccount) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please select a destination account' 
      });
      return;
    }

    const amount = parseFloat(this.editingTransaction.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please enter a valid amount greater than 0' 
      });
      return;
    }

    if (this.isEditMode) {
      this.updateTransaction();
    } else {
      this.createTransfer();
    }
  }

  createTransfer() {
    const command = {
      AccountFrom: this.editingTransaction.accountNumber,
      AccountTo: this.selectedAccount.accountNumber, 
      Amount: parseFloat(this.editingTransaction.amount),
      description: this.editingTransaction.description || `Transfer to ${this.selectedPerson.firstName} ${this.selectedPerson.lastName}`
    };
    this.apiTransactions.transfer(command).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Transfer completed successfully' 
        });
        this.ref.close(true);
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || error.error || 'Transfer failed';
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: errorMessage 
        });
      }
    });
  }

  updateTransaction() {
    const transaction = {
      transactionId: this.editingTransaction.transactionId,
      accountId: this.editingTransaction.accountId,
      transactionDate: this.date,
      amount: parseFloat(this.editingTransaction.amount),
      description: this.editingTransaction.description || '',
      transactionType: this.editingTransaction.transactionType
    };

    this.apiTransactions.updateTransaction(transaction).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Transaction updated successfully' 
        });
        this.ref.close(true);
      },
      error: (error: any) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update transaction' 
        });
      }
    });
  }

  hideDialog() {
    this.ref.close(false);
  }
}