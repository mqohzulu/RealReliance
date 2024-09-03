import { Component } from '@angular/core';
import { Account, CreateAccountCommand } from '../interfaces/Accounts-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAccountsService } from '../services/api-accounts.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-accounts-details',
  templateUrl: './accounts-details.component.html',
  styleUrls: ['./accounts-details.component.css']
})
export class AccountsDetailsComponent {
  accountID: any;
  personID: any;
  createdAccountId: string = '';
  isAdmin:boolean =this.authService.getUser() =='Admin';
  constructor(private messageService: MessageService,
    private router: Router,
    private activateRoutes: ActivatedRoute,
    private authService: AuthenticationService,
    private confirmationService:ConfirmationService,
    private apiAccount: ApiAccountsService) { }

  public account: Account = {
    accountID: "",
    accountNumber: "",
    accountType: "",
    activeInd: true,
    balance: 0,
    personID: "",
    status: false
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
    if (!this.accountID) {
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
    this.router.navigate(['/person-details'], { queryParams: { person_id: this.personID } });

  }
  closeAccount(){
    this.confirmationService.confirm({
      message: 'Are you sure you want to close this account?',
      accept: () => {
        this.apiAccount.closeAccount(this.accountID).subscribe({
          next:(data:any)=>{
            this.messageService.add({severity:'success',summary:'success', detail:'Account successfully Closed'})
          }
        })
      },
      reject: () => {
        this.refresh()
      }
    });
  }
  deactivateAccount(){
    this.confirmationService.confirm({
      message: 'Are you sure you want to deactivate this account?',
      accept: () => {
        this.apiAccount.deactivateAccount(this.accountID).subscribe({
          next:(data:any)=>{
            this.refresh();
            this.messageService.add({severity:'success',summary:'success', detail:'Account successfully deactivated'})
          }
        })
      },
      reject: () => {
        this.refresh()
      }
    });
  }
  createAccount() {
    const command: CreateAccountCommand = {
      PersonId: this.personID,
      AccountNumber: this.account.accountNumber,
      AccountType: this.account.accountType,
      Balance: this.account.balance,
      IsClosed: false,
      ActiveInd: this.account.activeInd
    }
    this.apiAccount.createAccount(command).subscribe({
      next: (data: string) => {
        this.createdAccountId = data;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Account Successfully created' });
        this.refresh();
        window.location.reload()
      }
    })
  }

}
