import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, finalize, map, Observable, switchMap, take, tap, throwError } from 'rxjs';
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
  private readonly tokenKey = 'token';
  private readonly refreshTokenKey = 'refreshToken';
  private refreshInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
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
        catchError(this.handleHttpError('Login Failed', (error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return `Client-side error: ${error.error.message}`;
          }
          if (error.status === 401) {
            return 'Incorrect Username or Password';
          }
          return this.buildServerErrorMessage(error);
        }))
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
            if (response.refreshToken) {
              this.saveRefreshToken(response.refreshToken);
            }
            this.saveExpiresFromToken(response.token);
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

  saveRefreshToken(refreshToken: string): void {
    this.localStorageService.setItem(this.refreshTokenKey, refreshToken);
  }

  getRefreshToken(): string | null {
    return this.localStorageService.getItem(this.refreshTokenKey);
  }

  private saveExpiresFromToken(token: string): void {
    const expiryDate = this.getTokenExpiryDate(token);
    if (expiryDate) {
      this.saveExpires(expiryDate.getTime());
    }
  }

  private getTokenExpiryDate(token: string): Date | null {
    try {
      const decoded = jwtDecode<{ exp?: number }>(token);
      if (decoded?.exp) {
        return new Date(decoded.exp * 1000);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  public isAuthenticated(): boolean {
    const user = this.getUser();
    const hasExpired = this.hasTokenExpired();
    if (hasExpired) {
      this.logout();
    }
    return user != null && !hasExpired;
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
      } else {
        const token = this.getToken();
        if (token) {
          const tokenExpiry = this.getTokenExpiryDate(token);
          if (tokenExpiry) {
            const tokenExpiryTimestamp = tokenExpiry.getTime();
            this.saveExpires(tokenExpiryTimestamp);
            ret = tokenExpiryTimestamp <= Date.now();
          }
        }
      }
    } catch (error) {
      ret = true;
    }
    return ret;
  }

  saveExpires(expires: Date | any): void {
    this.localStorageService.setItem('expires', expires);
  }

  isTokenExpiringSoon(thresholdSeconds: number = 120): boolean {
    const expiryDate: Date | any = this.getExpires();
    const currentTimestamp = Date.now();
    if (expiryDate) {
      return (expiryDate - currentTimestamp) <= thresholdSeconds * 1000;
    }

    const token = this.getToken();
    if (!token) {
      return false;
    }

    const tokenExpiry = this.getTokenExpiryDate(token);
    if (!tokenExpiry) {
      return false;
    }

    const tokenExpiryTimestamp = tokenExpiry.getTime();
    this.saveExpires(tokenExpiryTimestamp);
    return (tokenExpiryTimestamp - currentTimestamp) <= thresholdSeconds * 1000;
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.refreshInProgress) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    this.refreshInProgress = true;
    this.refreshTokenSubject.next(null);

    const url = `${this.apiUrl}/Authentication/refresh-token`;
    return this.http.post<any>(url, { refreshToken }).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.saveToken(response.token.trim());
          this.saveExpiresFromToken(response.token);
        }
        if (response?.refreshToken) {
          this.saveRefreshToken(response.refreshToken);
        }
        if (response?.token) {
          this.refreshTokenSubject.next(response.token);
        }
      }),
      map((response: any) => {
        if (!response?.token) {
          throw new Error('Invalid refresh token response');
        }
        return response.token as string;
      }),
      catchError((error: HttpErrorResponse) => {
        this.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInProgress = false;
      })
    );
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
        catchError(this.handleHttpError('Registration Failed', (error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return `Client-side error: ${error.error.message}`;
          }
          if (error.status === 409) {
            return 'An account with this email already exists.';
          }
          return this.buildServerErrorMessage(error);
        }))
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
        catchError(this.handleHttpError('Password Reset Failed', (error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return `Client-side error: ${error.error.message}`;
          }
          if (error.status === 404) {
            return 'No account found with this email address';
          }
          if (error.status === 429) {
            return 'Too many password reset attempts. Please try again later.';
          }
          if (error.status === 400) {
            return error.error?.message || 'Invalid email format';
          }
          return this.buildServerErrorMessage(error);
        }))
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
        catchError(this.handleHttpError('Password Reset Failed', (error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return `Client-side error: ${error.error.message}`;
          }
          if (error.status === 400) {
            return error.error?.message || 'Invalid or expired reset token';
          }
          if (error.status === 401) {
            return 'Password reset token has expired. Please request a new one.';
          }
          return `Server-side error: ${error.status} ${error.statusText}`;
        }))
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
        catchError(this.handleHttpError('Change Password Failed', (error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            return `Client-side error: ${error.error.message}`;
          }
          if (error.status === 400) {
            return error.error?.message || 'Invalid current password';
          }
          if (error.status === 401) {
            return 'Your session has expired. Please login again.';
          }
          return `Server-side error: ${error.status} ${error.statusText}`;
        }))
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

  private handleHttpError(
    summary: string,
    messageBuilder: (error: HttpErrorResponse) => string
  ) {
    return (error: HttpErrorResponse) => {
      const errorMessage = messageBuilder(error) || 'An unknown error occurred';

      this.messageService.add({
        severity: 'error',
        summary,
        detail: errorMessage
      });

      return throwError(() => new Error(errorMessage));
    };
  }

  private buildServerErrorMessage(error: HttpErrorResponse): string {
    let message = `Server-side error: ${error.status} ${error.statusText}`;
    if (error.status === 0) {
      message += '\nPossible causes: Server is down, Network issue, or CORS problem';
    }
    return message;
  }
}
