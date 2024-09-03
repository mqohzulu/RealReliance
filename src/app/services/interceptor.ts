import { HttpErrorResponse, HttpEvent,HttpHandler,HttpInterceptor, HttpRequest} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { AuthenticationService } from "./authentication.service";
import { Router } from "@angular/router";

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor{
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    if(token ){
      const processedToken = token.replace(/^"|"$/g, '').trim(); 
      req = req.clone({       
          setHeaders:{
            Authorization: `Bearer ${processedToken}` 
          }
      });
    }

    return next.handle(req);
  }
}