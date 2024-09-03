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
  isAdmin: boolean = this.authService.getUser() == 'Admin';

  person: Person = {
    PersonId: '',
    IdNumber: '',
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    Address: '',
    DateOfBirth: new Date('2001/12/10'),
    ActiveInd: true
  };
  constructor(
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private authService: AuthenticationService,
    private activateRoutes: ActivatedRoute,
    private apiPerson: ApiPersonService) { }
  ngOnInit(): void {
    this.activateRoutes.queryParams.subscribe(params => {
      this.personID = params['person_id'] ?? null;
      console.log("person:", this.personID);
      if (this.personID && this.personID !== "00000000-0000-0000-0000-000000000000") {
        this.getPersonById();
      } else {
        this.getPersonByEmail();
      }
      // if (this.person.PersonId !== this.personID && this.personID!=null && !this.isAdmin) {
      //   this.router.navigateByUrl("/insufficient-rights");
      // } 
    });
  }

  refresh() {
    this.getPersonById()
  }

  getPersonById() {
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
          console.log(this.person);
        }
      })
    }

  }
  addNewPerson() {
    const personData = {
      personId: this.person.PersonId || '00000000-0000-0000-0000-000000000000',
      idNumber: parseInt(this.person.IdNumber?.toString() || '0'),
      firstName: this.person.FirstName || '',
      lastName: this.person.LastName || '',
      email: this.person.Email || '',
      phoneNumber: this.person.PhoneNumber?.toString() || '',
      activeInd: this.person.ActiveInd || false,
      dateOfBirth: this.person.DateOfBirth ? new Date(this.person.DateOfBirth).toISOString() : new Date().toISOString()
    };
  
    console.log("CreatePersonCommand:", personData);
  
    const isNewPerson = !personData.personId || personData.personId === '00000000-0000-0000-0000-000000000000';
    const apiCall = isNewPerson ? this.apiPerson.addNewPerson(personData) : this.apiPerson.editPerson({ person: personData });
  
    apiCall.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: isNewPerson ? 'Person added successfully' : 'Person updated successfully' });
      },
      error: (error: Error) => {
        this.messageService.add({ severity: 'error', summary: 'Error occurred', detail: error.message });
      }
    });
  }

  navigateToDetails(): void {
    if (this.person.PersonId) {
      this.router.navigate(['/accounts-list', this.person.PersonId]);
    }
  }

  getPersonByEmail() {
    console.log(this.authService.getUser().email)
    this.apiPerson.getPersonByEmail(this.authService.getUser().email).subscribe({
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
        if (this.person.PersonId == '00000000-0000-0000-0000-000000000000') {
          this.messageService.add({ severity: 'info', summary: 'No profile found', detail: "Please fill in your profile details" })
        }
        console.log("Person details by email", data)
      }
    })
  }
  deactivatePerson() {
    if (!this.person.ActiveInd) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to deactivate this account?',
        accept: () => {
          this.apiPerson.deactivatePerson(this.personID).subscribe({
            next: (data: any) => {
              this.refresh();
              this.messageService.add({ severity: 'success', summary: 'success', detail: 'Person successfully deactivated' })
            }
          })
        },
        reject: () => {
          this.refresh()
        }
      });
    }

  }

}
