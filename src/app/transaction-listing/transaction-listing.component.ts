import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';
import { ApiTransactionsService } from '../services/api-transactions.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiAccountsService } from '../services/api-accounts.service';
import { Transaction } from '../interfaces/Transaction';


@Component({
  selector: 'app-transaction-listing',
  templateUrl: './transaction-listing.component.html',
  styleUrls: ['./transaction-listing.component.css']
})
export class TransactionListingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() accountId: string = '';
  @Output() refreshAccount = new EventEmitter<void>();

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  accountNumber: string = '';
  isLoading = false;
  error: string = '';
  searchTransaction: string = '';
  
  ref: DynamicDialogRef | undefined;

  constructor(
    private apiTransactions: ApiTransactionsService,
    public dialogService: DialogService,
    private apiAccount: ApiAccountsService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accountId']?.currentValue !== changes['accountId']?.previousValue) {
      this.loadData();
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    if (!this.accountId) return;

    this.isLoading = true;
    this.error = '';

    forkJoin({
      transactions: this.apiTransactions.getAccountTransactions(this.accountId),
      account: this.apiAccount.getAccountById(this.accountId)
    }).subscribe({
      next: ({ transactions, account }) => {
        this.transactions = transactions;
        this.filteredTransactions = [...transactions];
        this.accountNumber = account.accountNumber;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load data';
        this.isLoading = false;
        this.transactions = [];
        this.filteredTransactions = [];
      }
    });
  }

  applyFilterGlobal(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTransaction = filterValue;
    
    if (!filterValue.trim()) {
      this.filteredTransactions = [...this.transactions];
      return;
    }

    this.filteredTransactions = this.transactions.filter(transaction => {
      return (
        transaction.transactionId?.toLowerCase().includes(filterValue) ||
        transaction.transactionType?.toLowerCase().includes(filterValue) ||
        transaction.description?.toLowerCase().includes(filterValue) ||
        transaction.amount?.toString().includes(filterValue) ||
        transaction.transactionDate?.toString().toLowerCase().includes(filterValue)
      );
    });
  }

  clearSearch(): void {
    this.searchTransaction = '';
    this.filteredTransactions = [...this.transactions];
  }

  openEditDialog(transaction: Transaction, edit: boolean): void {
    if (!edit) {
      if (!this.accountNumber) return;

      transaction = {
        accountNumber: this.accountNumber,
        accountId: this.accountId,
        amount: 0,
        description: '',
        transactionDate: new Date(),
        transactionId: '',
        transactionType: 'Debit'
      };
    }

    this.ref = this.dialogService.open(TransactionDialogComponent, {
      data: transaction,
      header: edit ? 'Edit Transaction' : 'New Transaction',
      width: '500px'
    });

    this.ref.onClose.subscribe((shouldRefresh: boolean) => {
      if (shouldRefresh) {
        this.loadData();
        this.refreshAccount.emit();
      }
    });
  }
openNewTransaction(): void {
  this.openEditDialog({} as Transaction, false);
}
  retryLoad(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
  }
}