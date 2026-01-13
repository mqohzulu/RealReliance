import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, switchMap, tap, throwError } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AppStateService } from './app-state.service';
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
    private messageService: MessageService,
    private appState: AppStateService
  ) {
    this.authChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this.apiUrl = environment.apiUrl;
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
          } else if(error.status == 401){
            errorMessage = `Incorrect Username or Password`;
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
            const userData = {
              firstName: response.firstName,
              lastName: response.lastName,
              email: response.email,
              role: response.role
            };
        
            this.localStorageService.setItem('LogginUser', JSON.stringify(userData));
            this.saveToken(response.token.trim());
            this.saveUser(response.email, response.firstName, response.lastname, response.role);
            this.isAuthenticatedSubject.next(true);
            
            this.appState.updateState({
              authenticated: true,
              user: {
                id: response.id || response.email,
                email: response.email,
                name: `${response.firstName} ${response.lastName}`,
                role: response.role
              },
              isAdmin: response.role === 'Admin',
              userName: `${response.firstName} ${response.lastName}`
            });
            
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Logged in successfully' 
            });
            
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
    const expires = this.getExpires();
    if(this.hasTokenExpired()){
      this.logout();
    }
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
    
    this.appState.updateState({
      authenticated: false,
      user: null,
      isAdmin: false,
      userName: ''
    });
    
    this.router.navigateByUrl('/login');
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Logged out', 
      detail: 'You have been logged out successfully' 
    });
  }

  listenForAuthEvent(callback: (event: any) => void): void {
    this.authChannel.onmessage = (event) => {
      callback(event.data);
    };
  }

  register(email: string, password: string, firstName: string, lastName: string, role: string): Observable<any> {
    return new Observable(observer => {
      const data = {
        Email: email,
        Password: password,
        FirstName: firstName,
        LastName: lastName,
        Role: role
      };
      const url = `${this.apiUrl}/Authentication/register`;
      this.http.post(url, data).pipe(
        tap(response => console.log('Registration response:', response)),
        switchMap(() => this.login(email, password)),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'An unknown error occurred';
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Client-side error: ${error.error.message}`;
          } else if (error.status === 409) {
            errorMessage = 'An account with this email already exists.';
          } else {
            errorMessage = `Server-side error: ${error.status} ${error.statusText}`;
            if (error.status === 0) {
              errorMessage += '\nPossible causes: Server is down, Network issue, or CORS problem';
            }
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail: errorMessage
          });

          return throwError(() => new Error(errorMessage));
        })
      ).subscribe({
        next: (response: any) => {
          if (response) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Registered and logged in successfully' 
            });
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

  forgotPassword(email: string): Observable<any> {
    return new Observable(observer => {
      const data = {
        email: email
      };
      
      const url = `${this.apiUrl}/Authentication/forgot-password`;
      
      this.http.post(url, data).pipe(
        tap(response => console.log('Forgot password response:', response)),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'An unknown error occurred';
          
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Client-side error: ${error.error.message}`;
          } else if (error.status === 404) {
            errorMessage = 'No account found with this email address';
          } else if (error.status === 429) {
            errorMessage = 'Too many password reset attempts. Please try again later.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid email format';
          } else {
            errorMessage = `Server-side error: ${error.status} ${error.statusText}`;
            if (error.status === 0) {
              errorMessage += '\nPossible causes: Server is down, Network issue, or CORS problem';
            }
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Password Reset Failed',
            detail: errorMessage
          });

          return throwError(() => new Error(errorMessage));
        })
      ).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Password Reset',
            detail: 'Password reset instructions have been sent to your email'
          });
          
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return new Observable(observer => {
      const data = {
        token: token,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };
      
      const url = `${this.apiUrl}/Authentication/reset-password`;
      
      this.http.post(url, data).pipe(
        tap(response => console.log('Reset password response:', response)),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'An unknown error occurred';
          
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Client-side error: ${error.error.message}`;
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid or expired reset token';
          } else if (error.status === 401) {
            errorMessage = 'Password reset token has expired. Please request a new one.';
          } else {
            errorMessage = `Server-side error: ${error.status} ${error.statusText}`;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Password Reset Failed',
            detail: errorMessage
          });

          return throwError(() => new Error(errorMessage));
        })
      ).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Your password has been successfully reset. You can now login with your new password.'
          });
          
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return new Observable(observer => {
      const token = this.getToken();
      
      if (!token) {
        const error = new Error('No authentication token found');
        this.messageService.add({
          severity: 'error',
          summary: 'Change Password Failed',
          detail: 'You must be logged in to change your password'
        });
        observer.error(error);
        return;
      }
      
      const data = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };
      
      const url = `${this.apiUrl}/Authentication/change-password`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      this.http.post(url, data, { headers }).pipe(
        tap(response => console.log('Change password response:', response)),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'An unknown error occurred';
          
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Client-side error: ${error.error.message}`;
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid current password';
          } else if (error.status === 401) {
            errorMessage = 'Your session has expired. Please login again.';
          } else {
            errorMessage = `Server-side error: ${error.status} ${error.statusText}`;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Change Password Failed',
            detail: errorMessage
          });

          return throwError(() => new Error(errorMessage));
        })
      ).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Your password has been successfully changed.'
          });
          
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}