import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder, 
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\s()-]*$/)]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Message Sent Successfully',
          detail: 'Thank you for contacting us! We will get back to you within 24 hours.',
          life: 5000
        });

        console.log('Form submitted:', this.contactForm.value);
        
        this.sendEmail();

        this.contactForm.reset();
        this.isSubmitting = false;
      }, 1500);

      // In production, you would make an HTTP call like:
      // this.contactService.submitContactForm(this.contactForm.value).subscribe(
      //   response => {
      //     this.messageService.add({
      //       severity: 'success',
      //       summary: 'Message Sent',
      //       detail: 'We will get back to you soon!'
      //     });
      //     this.contactForm.reset();
      //     this.isSubmitting = false;
      //   },
      //   error => {
      //     this.messageService.add({
      //       severity: 'error',
      //       summary: 'Error',
      //       detail: 'Failed to send message. Please try again.'
      //     });
      //     this.isSubmitting = false;
      //   }
      // );
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Form',
        detail: 'Please fill in all required fields correctly.',
        life: 3000
      });
    }
  }

  private sendEmail(): void {
    const formData = this.contactForm.value;
    const subject = encodeURIComponent(formData.subject || 'Contact Form Submission');
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Phone: ${formData.phone || 'Not provided'}\n\n` +
      `Message:\n${formData.message}`
    );
    
    window.location.href = `mailto:mqohzulu@outlook.com?subject=${subject}&body=${body}`;
  }

  hasError(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    if (field?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      subject: 'Subject',
      message: 'Message'
    };
    return labels[fieldName] || fieldName;
  }
}