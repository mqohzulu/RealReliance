import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';
import { ApiTransactionsService } from '../services/api-transactions.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiAccountsService } from '../services/api-accounts.service';

@Component({
  selector: 'app-transaction-listing',
  templateUrl: './transaction-listing.component.html',
  styleUrls: ['./transaction-listing.component.css']
})
export class TransactionListingComponent implements OnInit, OnChanges {
  transactionsList: any; 
  @Input() accountId: any; 
  @Output() refreshAccount= new EventEmitter<void>()
   searchTransaction: any;
  public transaction: any;
  ref: DynamicDialogRef | undefined;
  accountNumber: any;
  constructor(private apiTransactions: ApiTransactionsService,
    public dialogService: DialogService,
    private apiAccount:ApiAccountsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accountId'] && changes['accountId'].currentValue !== changes['accountId'].previousValue) {
      this.reloadData();
      this.getaccountbyId();
    }
  }

  reloadData() {
    this.apiTransactions.getAccountTransactions(this.accountId).subscribe({
      next: (response: any) => {
        this.transaction = response;
        console.log("🚀 ~ TransactionListComponent ~ this.apiTransactions.getAccountTransactions ~ this.transactionsList:", this.transaction)
      }
    })
  }
  ngOnInit(): void {
    this.reloadData();
  }
  public transactions: any[] = [];
  applyFilterGlobal($event: Event, arg1: string) {
  }

  getaccountbyId(){
    this.apiAccount.getAccountById(this.accountId).subscribe({
      next:(data:any)=>{
        this.accountNumber = data.accountNumber
      }
    })
  }
  openEditDialog(transaction: any, edit:boolean) {
    if(!edit){
      transaction = {
        accountNumber: this.accountNumber,
        accountId: this.accountId,
        amount: 0,
        description: '',
        transactionDate: new Date,
        transactionId: '',
        transactionType: 'Debit' 
      }
    }
    this.ref = this.dialogService.open(TransactionDialogComponent, {
      data: transaction,
      header: 'Edit Transaction',
      width: '400px'
    });

    this.ref.onClose.subscribe((result: any) => {
        this.reloadData();
        this.triggerRefresh()
    });
  }
  
  triggerRefresh() {
    this.refreshAccount.emit();
  }
  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
