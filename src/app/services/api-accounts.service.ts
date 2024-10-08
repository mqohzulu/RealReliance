import { Injectable } from '@angular/core';
import { CreateAccountCommand } from '../interfaces/Accounts-models';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ApiAccountsService {


  constructor(private messageService:MessageService, private api: ApiService) { } 
  getAccountsByPersonId(personId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Accounts/GetAccountsByPersonId", { personId: personId }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting accounts for person', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
  getAccountById(personId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Accounts/getAccountById", { accountId: personId }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting account', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };

  getAccounts(activeOnly: boolean = true): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>('Accounts/GetAccounts', { activeOnly: activeOnly }).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error getting accounts',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
  createAccount(command: CreateAccountCommand): Observable<any> {
    return new Observable(observer => {
      this.api.post<any>('Accounts/CreateAccount', command).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error creating account',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
  closeAccount(accountId: string): Observable<any> {
    return new Observable(observer => {
      const payload = { accountId: accountId };  
      this.api.post<any>('Accounts/CloseAccount', payload).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error closing account',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
  deactivateAccount(accountId: string): Observable<any> {
    return new Observable(observer => {
      const payload = { accountId: accountId };  
      this.api.post<any>('Accounts/DeleteAccount', payload).subscribe({
        next: (response: any) => {
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error deactivating account',
            detail: error.error
          });
          observer.error(error);
        }
      });
    });
  }
}
