import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, Observable, switchMap, throwError } from "rxjs";
import { AuthenticationService } from "./authentication.service";

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshTokenRequest(req)) {
      return this.handleRequest(req, next);
    }

    const token = this.getStoredToken();
    if (!token) {
      return this.handleRequest(req, next);
    }

    if (this.authService.isTokenExpiringSoon()) {
      return this.authService.refreshAccessToken().pipe(
        switchMap((newToken) => {
          const refreshedRequest = this.addAuthHeader(req, newToken);
          return this.handleRequest(refreshedRequest, next);
        })
      );
    }

    const authRequest = this.addAuthHeader(req, token);
    return this.handleRequest(authRequest, next);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private isRefreshTokenRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/Authentication/refresh-token');
  }

  private addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const processedToken = token.replace(/^"|"$/g, '').trim();
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${processedToken}`
      }
    });
  }

  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.handleUnauthorized();
        }
        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(): void {
    if (this.authService && typeof this.authService.logout === 'function') {
      this.authService.logout();
    } else {
      this.performLogout();
    }

    // Redirect to login page
    const currentUrl = this.router.url;
    this.router.navigate(['/login'], {
      queryParams: { 
        redirectUrl: currentUrl,
        sessionExpired: true 
      }
    });
  }

  private performLogout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.clear();

    this.clearAuthCookies();
  }

  private clearAuthCookies(): void {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}
