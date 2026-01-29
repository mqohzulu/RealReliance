import { Inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, take } from 'rxjs';
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
    return this.getDashboardData().pipe(
      map(({ people, accounts, transactions }) => {
        const totalBalance = accounts.reduce((sum: number, account: any) => {
          return sum + (account.balance ?? account.Balance ?? 0);
        }, 0);
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum: number, transaction: any) => {
          const amount = transaction.amount ?? transaction.Amount ?? 0;
          const type = transaction.transactionType ?? transaction.TransactionType ?? '';
          return sum + (type === 'Credit' ? amount : -amount);
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
  }

  getDashboardData(): Observable<{ people: any[]; accounts: any[]; transactions: any[] }> {
    return forkJoin({
      people: this.apiPerson.getPersonsList(true).pipe(take(1)),
      accounts: this.apiData.getAccounts(true).pipe(take(1)),
      transactions: this.apitransaction.getTransactions(true).pipe(take(1))
    });
  }

}
