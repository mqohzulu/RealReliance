import { Inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiPersonService } from './api-person.service';
import { ApiAccountsService } from './api-accounts.service';
import { ApiTransactionsService } from './api-transactions.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = this.environment.apiUrl;


  constructor(private http: HttpClient, @Inject('ENVIRONMENT') private environment: any, 
  private api:ApiService, private apiPerson:ApiPersonService, private apiData:ApiAccountsService,private apitransaction:ApiTransactionsService) { }

  getChartData(): Observable<any> {
    return this.apiPerson.getPersonsList(true).pipe(
      switchMap(people => {
        return this.apiData.getAccounts(true).pipe(
          switchMap(accounts => {
            return this.apitransaction.getTransactions(true).pipe(
              map(transactions => {
                const totalBalance = accounts.reduce((sum: any, account: { Balance: any; }) => sum + account.Balance, 0);
                const totalTransactions = transactions.length;
                const totalAmount = transactions.reduce((sum: any, transaction: { TransactionType: string; Amount: number; }) => {
                  return sum + (transaction.TransactionType === 'Credit' ? transaction.Amount : -transaction.Amount);
                }, 0);
  
                return {
                  peopleCount: people.length,
                  accountCount: accounts.length,
                  totalBalance,
                  totalTransactions,
                  totalAmount
                };
              })
            );
          })
        );
      })
    );
  }

}
