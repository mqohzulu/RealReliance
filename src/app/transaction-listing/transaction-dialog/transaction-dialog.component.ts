import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Account } from 'src/app/interfaces/Accounts-models';
import { Person } from 'src/app/interfaces/persons-models';
import { Transaction } from 'src/app/interfaces/Transaction';
import { ApiAccountsService } from 'src/app/services/api-accounts.service';
import { ApiPersonService } from 'src/app/services/api-person.service';
import { ApiTransactionsService } from 'src/app/services/api-transactions.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



@Component({
  selector: 'app-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.css']
})
export class TransactionDialogComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  maxDate: Date = new Date();
  editingTransaction: Partial<Transaction> = {};
  isEditMode: boolean = false;

  persons: Person[] = [];
  selectedPersonAccounts: Account[] = [];
  
  selectedPerson: Person | null = null;
  selectedAccount: Account | null = null;
  date: Date = new Date();

  isLoading = false;
  error: string | null = null;

  constructor(
    private apiTransactions: ApiTransactionsService,
    private apiAccounts: ApiAccountsService,
    private apiPerson: ApiPersonService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public messageService: MessageService
  ) { }

  ngOnInit() {
    this.initializeTransaction();
    this.getPersons();
  }

  private initializeTransaction(): void {
    if (this.config.data?.transactionId) {
      this.editingTransaction = { ...this.config.data };
      this.isEditMode = true;
      if (this.editingTransaction.transactionDate) {
        this.date = new Date(this.editingTransaction.transactionDate);
      }
    } else {
      this.editingTransaction = {
        transactionId: '',
        accountId: '',
        accountNumber: '',
        amount: 0,
        description: '',
        transactionType: 'Transfer',
        transactionDate: new Date()
      };
      this.isEditMode = false;
    }
  }

  getPersons() {
    this.isLoading = true;
    this.error = null;

    this.apiPerson.getPersonsList(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (data: Person[]) => {
        this.persons = data
          .filter(person => person.PersonId !== this.config.data?.personId)
          .map(person => ({
            ...person,
            displayName: `${person.FirstName} ${person.LastName} (${person.IdNumber})`
          }));
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load persons';
        this.isLoading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load persons' 
        });
      }
    });
  }

  onPersonChange(event: any) {
    this.selectedPerson = event.value;
    
    if (this.selectedPerson) {
      this.selectedPersonAccounts = this.selectedPerson.Accounts?.filter(
        account => account.activeInd && !account.status
      ) || [];
      
      this.selectedAccount = null;
      
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
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.error = null;

    if (this.isEditMode) {
      this.updateTransaction();
    } else {
      this.createTransfer();
    }
  }

  private validateForm(): boolean {
    if (!this.selectedPerson) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please select a recipient person' 
      });
      return false;
    }

    if (!this.selectedAccount) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please select a destination account' 
      });
      return false;
    }

    const amount = parseFloat(this.editingTransaction.amount?.toString() || '0');
    if (!amount || amount <= 0 || isNaN(amount)) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please enter a valid amount greater than 0' 
      });
      return false;
    }

    return true;
  }

  createTransfer() {
    const command = {
      AccountFrom: this.editingTransaction?.accountNumber,
      AccountTo: this.selectedAccount!.accountNumber,
      Amount: parseFloat(this.editingTransaction.amount!.toString()),
      description: this.editingTransaction.description ||  `Transfer to ${this.selectedPerson!.FirstName} ${this.selectedPerson!.LastName}`
    };

    this.apiTransactions.transfer(command)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Transfer completed successfully' 
        });
        this.ref.close(true);
      },
      error: (error: any) => {
        this.isLoading = false;
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
    const transaction: Transaction = {
      transactionId: this.editingTransaction.transactionId!,
      accountId: this.editingTransaction.accountId!,
      transactionDate: this.date,
      amount: parseFloat(this.editingTransaction.amount!.toString()),
      description: this.editingTransaction.description || '',
      transactionType: this.editingTransaction.transactionType!,
      accountNumber: this.editingTransaction.accountNumber!
    };

    this.apiTransactions.updateTransaction(transaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Transaction updated successfully' 
        });
        this.ref.close(true);
      },
      error: () => {
        this.isLoading = false;
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
