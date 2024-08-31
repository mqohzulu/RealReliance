import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService,
    private localStorageService: LocalStorageService,
    private messageService: MessageService
  ) {
    this.authChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this.isAuthenticatedSubject.next(this.isAuthenticated());
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/authentication/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          this.saveToken(response.token);
          this.saveUser(response.email, response.firstName, response.lastname, response.role);
          this.isAuthenticatedSubject.next(true);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Logged in successfully' });
        }
      })
    );
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

  isAuthenticated(): boolean {
    const user = this.getUser();
    return !!user && !this.hasTokenExpired();
  }

  hasTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    // Implement token expiration check here
    // This is a placeholder and should be replaced with actual JWT decoding and expiration check
    return false;
  }

  logout(): void {
    this.localStorageService.clear();
    this.isAuthenticatedSubject.next(false);
    this.router.navigateByUrl('/login');
  }

  listenForAuthEvent(callback: (event: any) => void): void {
    this.authChannel.onmessage = (event) => {
      callback(event.data);
    };
  }
}