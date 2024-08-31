import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TransferFundsCommand } from '../interfaces/Transafer';
import { ApiService } from './api.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ApiTransactionsService {

  constructor(private api:ApiService, private messageService:MessageService ) { }

  getPersonsList(activeOnly: boolean): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/GetPersons", { activeOnly: activeOnly }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting persons', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };

  getTransactions(activeOnly: boolean = false): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>('Transaction/GetTransactions', { activeOnly: activeOnly }).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error getting transactions',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }

  getAccountTransactions(accountId:string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>('Transaction/GetAccountTransactions', { accountId: accountId }).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error getting transactions',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
  getTransactionDetails(id:string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>('Transaction/GetAccountTransactions', { id: id }).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error getting transactions',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
  transfer(command:TransferFundsCommand): Observable<any> {
    return new Observable(observer => {
      this.api.post<any>('Transaction/Transfer', command).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error getting transactions',
            detail: error.error.title
          });
          observer.error(error);
        }
      });
    });
  }

}
