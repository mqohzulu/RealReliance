import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MessageService } from 'primeng/api';

export interface SendContactCommand {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface SendContactResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(
    private messageService: MessageService, 
    private api: ApiService
  ) { }

  submitContactForm(formData: SendContactCommand): Observable<SendContactResult> {
    return new Observable(observer => {
      this.api.post<SendContactResult>("Contact/submit", formData).subscribe({
        next: (response: SendContactResult) => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Message Sent Successfully', 
            detail: response.message,
            life: 5000
          });
          observer.next(response);
          observer.complete();
        },
        error: (error: any) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error Sending Message', 
            detail: error.error?.message || 'Failed to send message. Please try again.',
            life: 5000
          });
          observer.error(error);
        }
      });
    });
  }
}