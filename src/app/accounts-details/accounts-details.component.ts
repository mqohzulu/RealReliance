import { Component } from '@angular/core';
import { Account, CreateAccountCommand } from '../interfaces/Accounts-models';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAccountsService } from '../services/api-accounts.service';

@Component({
  selector: 'app-accounts-details',
  templateUrl: './accounts-details.component.html',
  styleUrls: ['./accounts-details.component.css']
})
export class AccountsDetailsComponent {
  accountID: any;
  personID: any;
  createdAccountId: string='';
  constructor(private messageService: MessageService,
    private router: Router,
     private activateRoutes: ActivatedRoute, 
     private apiAccount: ApiAccountsService) { }
  public account: Account = {
    accountID: "",
    accountNumber: "",
    accountType: "",
    activeInd: true,
    balance: 0,
    personID: "",
    status: null
  };

  public accountTypes: any[] = [
    { label: 'Checking', value: 'Checking' },
    { label: 'Savings', value: 'Savings' }   
  ];


  ngOnInit(): void {
    this.activateRoutes.queryParams.subscribe(params => {
      this.accountID = params["account_id"] ?? null;
      this.personID = params["person_id"] ?? null;
      this.refresh();
    });
  }
  refresh() {
    this.getAccountDetailsbyId();
  }

  getAccountDetailsbyId() {
    if(!this.accountID){
      return;
    }
    this.apiAccount.getAccountById(this.accountID).subscribe({
      next: (data: any) => {
        this.account = data;
        console.log("🚀 ~ AccountsDetailsComponent ~ this.apiAccount.getAccountById ~ this.account :", this.account)
      }
    })
  }

  navigateToDetails() {
    this.router.navigate(['/person-details'], { queryParams: {person_id: this.personID} });
    
  }
  updateAccount() {
  const command: CreateAccountCommand ={
    PersonId : this.personID,
    AccountNumber: this.account.accountNumber,
    AccountType:this.account.accountType,
    Balance: this.account.balance,
    IsClosed:true,
    ActiveInd:this.account.activeInd

  }
    this.apiAccount.createAccount(command).subscribe({
      next:(data:string)=>{
        this.createdAccountId = data;
        this.refresh();
      }
    })
  }

}
