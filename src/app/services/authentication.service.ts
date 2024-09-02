import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private readonly CHANNEL_NAME = 'auth_channel';
  private readonly authChannel: BroadcastChannel;
  private tokenKey = 'token';
  public user: any | undefined;
  apiUrl: any;

  constructor(
    @Inject('ENVIRONMENT') private environment: any,
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService,
    private localStorageService: LocalStorageService,
    private messageService: MessageService
  ) {
    this.authChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this.apiUrl =environment.apiUrl;
    this.isAuthenticatedSubject.next(this.isAuthenticated());
  }

  login(email: string, password: string): Observable<any> {
    return new Observable(observer => {
      const data = {
        email: email,
        Password: password
      };
  
      const url = `${this.apiUrl}/Authentication/login`;
      this.http.post(url, data).pipe(
        tap(response => console.log('Login response:', response)),
        catchError((error: HttpErrorResponse) => {
  
          let errorMessage = 'An unknown error occurred';
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Client-side error: ${error.error.message}`;
          }else if(error.status == 401){
            errorMessage =`Incorrect Username or Password `;
          } else {
            errorMessage = `Server-side error: ${error.status} ${error.statusText}`;
            if (error.status === 0) {
              errorMessage += '\nPossible causes: Server is down, Network issue, or CORS problem';
            }
          }
  
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Login Failed', 
            detail: errorMessage 
          });
  
          return throwError(() => new Error(errorMessage));
        })
      ).subscribe({
        next: (response: any) => {
          if (response) {
            this.saveToken(response.token);
            this.saveUser(response.email, response.firstName, response.lastname, response.role);
            this.isAuthenticated();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Logged in successfully' });
            observer.next(response);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  saveToken(token: string): void {
    this.localStorageService.setItem(this.tokenKey, token);
  }

  saveUser(email: string, firstName: string, lastName: string, role: string): void {
    const user: any = { email, firstName, lastName, role };
    this.localStorageService.setItem('user', user);
    this.user = user;
  }

  getUser(): any | null {
    return this.localStorageService.getItem('user');
  }

  getToken(): string | null {
    return this.localStorageService.getItem(this.tokenKey);
  }

  public isAuthenticated(): boolean {

    const user = this.getUser();
    const expires = this.getExpires() 
    return user != null && !this.hasTokenExpired();
  }

  getExpires(): any | null {
    var expires: Date | any = this.localStorageService.getItem('expires');
    return expires;
  }

  hasTokenExpired(): boolean {
    var ret: boolean = false;
    try {
      var expiryDate: Date | any = this.getExpires();
      if (expiryDate) {

        const currentTimestamp = Date.now();
        ret = (expiryDate <= currentTimestamp);

      }
    } catch (error) {
      ret = true;
    }
    return ret;
  }
  saveExpires(expires: Date | any): void {
    this.localStorageService.setItem('expires', expires);
  }

  logout(): void {
    this.saveExpires(null);
    this.localStorageService.clear();
    this.isAuthenticatedSubject.next(false);
    this.router.navigateByUrl('/login');
    this.messageService.add({ severity: 'info', summary: 'Logged out', detail: 'You have been logged out successfully' });
  }

  listenForAuthEvent(callback: (event: any) => void): void {
    this.authChannel.onmessage = (event) => {
      callback(event.data);
    };
  }
}