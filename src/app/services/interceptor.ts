import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { AuthenticationService } from "./authentication.service";
import { Router } from "@angular/router";

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    if (token) {
      const processedToken = token.replace(/^"|"$/g, '').trim(); 
      req = req.clone({       
        setHeaders: {
          Authorization: `Bearer ${processedToken}` 
        }
      });
    }

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