import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiURL: string;
  constructor(private http: HttpClient, @Inject('ENVIRONMENT') private environment: any) {
    console.log("environment", environment)
    this.apiURL = environment.apiUrl;

    console.log("environment", this.apiURL)
  }

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("API error:", error);
    return throwError(() => 'Something went wrong. Please try again later.');
  }

  get<T>(url: string, params?: any, respType?:any): Observable<T> {
    const headers = this.getHeaders();

    let httpParams = new HttpParams();
    if (params) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          httpParams = httpParams.set(key, params[key] ?? "");
        }
      }
    }
    const _url: string = this.apiURL + "/" + url;
    return this.http.get<T>(_url, { headers, params: httpParams, responseType: respType ?? "json" });
  }

  post<T>(url: string, data: any, respType?:any): Observable<T> {
    const headers = this.getHeaders();
    const _url: string = this.apiURL + "/" + url;
    return this.http.post<T>(_url, data, { headers, responseType: respType ?? "json" });
  }
  put<T>(url: string, data: any): Observable<T> {
    const headers = this.getHeaders();
    const _url: string = this.apiURL + "/" + url;
    return this.http.put<T>(_url, data, { headers });
  }

  delete<T>(url: string, params?: any): Observable<T> {
    const headers = this.getHeaders();

    let httpParams = new HttpParams();
    if (params) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          httpParams = httpParams.set(key, params[key] ??"");
        }
      }
    }
    const _url:string = this.apiURL + "/" + url;
    return this.http.delete<T>(_url, { headers, params: httpParams });
  }
}