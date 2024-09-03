import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ApiAccountsService } from '../services/api-accounts.service';
import { Router } from '@angular/router';
import { ApiPersonService } from '../services/api-person.service';

@Component({
  selector: 'app-accounts-listing',
  templateUrl: './accounts-listing.component.html',
  styleUrls: ['./accounts-listing.component.css']
})
export class AccountsListingComponent implements OnInit,OnChanges {
  accounts: any[] = [];
  searchAccount: string = '';
  public person: any;
  @Input() personID: any;

  constructor( private apiPerson:ApiPersonService,
    private router:Router, 
    private apiAccounts: ApiAccountsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personID'] && changes['personID'].currentValue !== changes['personID'].previousValue) {
      this.reloadData();
    }
  }

  ngOnInit(): void {
    this.reloadData();
  }

  private reloadData(): void {
    this.loadAccounts();
    this.getPersonById();
    this.getAccountsByPersonId();
  }

  loadAccounts(): void {
    
  }

  showTransactions(){
    this.router.navigateByUrl(`/transaction-list`);
  }

  applyFilterGlobal(event: any, mode: string): void {
    this.accounts = this.accounts.filter(account => account.AccountId.includes(event.target.value));
  }

  addAccount(person_id: string): void {
    this.router.navigate(['/account-details'], { 
      queryParams: { 
        person_id: person_id
      } 
    });
  }

  private getPersonById(): void {
    if (this.personID && this.personID !=='00000000-0000-0000-0000-000000000000') {
      this.apiPerson.getPersonById(this.personID).subscribe((person: any) => {
        this.person = person;
        console.log("🚀 ~ this.apiPerson.getPersonById ~  this.person:",  this.person)
      });
    }
  }
   getAccountsByPersonId(): void {
    if (this.personID && this.personID !== '00000000-0000-0000-0000-000000000000') {
      this.apiAccounts.getAccountsByPersonId(this.personID).subscribe((accounts: any) => {
        this.accounts = accounts;
        console.log("accounts",  this.accounts)
      });
    }
  }
  openEdit(account_id:string){
    this.router.navigate(['/account-details'], { queryParams: {person_id: this.personID, account_id} });
  }

}
