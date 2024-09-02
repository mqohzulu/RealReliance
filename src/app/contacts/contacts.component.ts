import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent {
  contactForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private messageService:MessageService) {
    this.contactForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.messageService.add({severity: 'success', summary: 'Success', detail: 'successfully sent'});
      console.log('Form submitted:', this.contactForm.value);
      // Here you would typically send the form data to a server
      // For now, we'll just log it to the console
    }
  }

}
