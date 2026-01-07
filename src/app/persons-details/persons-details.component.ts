import { Component, OnInit } from '@angular/core';
import { ApiPersonService } from '../services/api-person.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Person } from '../interfaces/persons-models';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-persons-details',
  templateUrl: './persons-details.component.html',
  styleUrls: ['./persons-details.component.css']
})
export class PersonsDetailsComponent implements OnInit {
  personID: any;
  isAdmin: boolean = false;
  isMyProfile: boolean = false;

  person: Person = {
    PersonId: '00000000-0000-0000-0000-000000000000',
    IdNumber: '',
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    Address: '',
    DateOfBirth: new Date(),
    ActiveInd: true
  };

  constructor(
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private authService: AuthenticationService,
    private activateRoutes: ActivatedRoute,
    private apiPerson: ApiPersonService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getUser();
    this.isAdmin = currentUser?.role === 'Admin';

    const currentPath = this.router.url.split('?')[0];
    this.isMyProfile = currentPath.includes('/my-profile');

    console.log('Current path:', currentPath);
    console.log('Is my profile:', this.isMyProfile);

    if (this.isMyProfile) {
      // Load current user's profile by email
      this.getPersonByEmail();
    } else {
      // Check for person_id in query params (for admin editing another person)
      this.activateRoutes.queryParams.subscribe(params => {
        this.personID = params['person_id'] ?? null;
        console.log('Person ID from query:', this.personID);

        if (this.personID && this.personID !== '00000000-0000-0000-0000-000000000000') {
          this.getPersonById();
        } else {
          // Clear view for adding new person
          this.initializeNewPerson();
        }
      });
    }
  }

  initializeNewPerson(): void {
    this.person = {
      PersonId: '00000000-0000-0000-0000-000000000000',
      IdNumber: '',
      FirstName: '',
      LastName: '',
      Email: '',
      PhoneNumber: '',
      Address: '',
      DateOfBirth: new Date(),
      ActiveInd: true
    };
    console.log('Initialized new person view');
  }

  refresh(): void {
    if (this.isMyProfile) {
      this.getPersonByEmail();
    } else if (this.personID && this.personID !== '00000000-0000-0000-0000-000000000000') {
      this.getPersonById();
    }
  }

  getPersonById(): void {
    if (this.personID) {
      this.apiPerson.getPersonById(this.personID).subscribe({
        next: (data: any) => {
          this.person = {
            PersonId: data.personID,
            IdNumber: data.idNumber,
            FirstName: data.firstName,
            LastName: data.lastName,
            Email: data.email,
            PhoneNumber: data.phoneNumber,
            Address: data.address || '',
            DateOfBirth: new Date(data.dateOfBirth),
            ActiveInd: data.activeInd
          };
          console.log('Loaded person by ID:', this.person);
        },
        error: (error: Error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error loading person', 
            detail: error.message 
          });
        }
      });
    }
  }

  getPersonByEmail(): void {
    const currentUserEmail = this.authService.getUser()?.email;
    
    if (!currentUserEmail) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Unable to retrieve user email' 
      });
      return;
    }

    console.log('Fetching person by email:', currentUserEmail);

    this.apiPerson.getPersonByEmail(currentUserEmail).subscribe({
      next: (data: any) => {
        this.person = {
          PersonId: data.personID,
          IdNumber: data.idNumber,
          FirstName: data.firstName,
          LastName: data.lastName,
          Email: data.email,
          PhoneNumber: data.phoneNumber,
          Address: data.address || '',
          DateOfBirth: new Date(data.dateOfBirth),
          ActiveInd: data.activeInd
        };

        if (this.person.PersonId === '00000000-0000-0000-0000-000000000000') {
          this.messageService.add({ 
            severity: 'info', 
            summary: 'No profile found', 
            detail: 'Please fill in your profile details' 
          });
        }

        console.log('Loaded person by email:', this.person);
      },
      error: (error: Error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error loading profile', 
          detail: error.message 
        });
      }
    });
  }

  addNewPerson(): void {
    if (!this.person.FirstName || !this.person.LastName || !this.person.Email) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Error', 
        detail: 'Please fill in all required fields (First Name, Last Name, Email)' 
      });
      return;
    }

    const personData = {
      personId: this.person.PersonId || '00000000-0000-0000-0000-000000000000',
      idNumber: parseInt(this.person.IdNumber?.toString() || '0'),
      firstName: this.person.FirstName.trim(),
      lastName: this.person.LastName.trim(),
      email: this.person.Email.trim(),
      phoneNumber: this.person.PhoneNumber?.toString() || '',
      address: this.person.Address?.trim() || '',
      activeInd: this.person.ActiveInd ?? true,
      dateOfBirth: this.person.DateOfBirth ? new Date(this.person.DateOfBirth).toISOString() : new Date().toISOString()
    };

    console.log('Saving person data:', personData);

    const isNewPerson = !personData.personId || personData.personId === '00000000-0000-0000-0000-000000000000';
    const apiCall = isNewPerson 
      ? this.apiPerson.addNewPerson(personData) 
      : this.apiPerson.editPerson({ person: personData });

    apiCall.subscribe({
      next: (response: any) => {
        const successMessage = isNewPerson ? 'Person added successfully' : 'Person updated successfully';
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: successMessage 
        });

        if (isNewPerson && response?.personID) {
          this.person.PersonId = response.personID;
          this.personID = response.personID;
        }

        this.refresh();
      },
      error: (error: Error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error saving person', 
          detail: error.message 
        });
      }
    });
  }

  navigateToDetails(): void {
    if (this.person.PersonId && this.person.PersonId !== '00000000-0000-0000-0000-000000000000') {
      this.router.navigate(['/person-list']);
    }
  }

  deactivatePerson(): void {
    if (!this.personID || this.personID === '00000000-0000-0000-0000-000000000000') {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Cannot deactivate', 
        detail: 'Person must be saved before deactivation' 
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to deactivate this account?',
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiPerson.deactivatePerson(this.personID).subscribe({
          next: () => {
            this.person.ActiveInd = false;
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Person successfully deactivated' 
            });
            this.refresh();
          },
          error: (error: Error) => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error deactivating person', 
              detail: error.message 
            });
          }
        });
      },
      reject: () => {
        this.refresh();
      }
    });
  }
}