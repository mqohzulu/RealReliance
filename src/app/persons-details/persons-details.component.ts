import { Component, OnInit } from '@angular/core';
import { ApiPersonService } from '../services/api-person.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Person } from '../interfaces/persons-models';

@Component({
  selector: 'app-persons-details',
  templateUrl: './persons-details.component.html',
  styleUrls: ['./persons-details.component.css']
})
export class PersonsDetailsComponent implements OnInit {
  personID: any;

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
  private messageService:MessageService, 
  private router:Router, 
  private activateRoutes:ActivatedRoute,
   private apiPerson:ApiPersonService){}
  ngOnInit(): void {
    this.activateRoutes.queryParams.subscribe(params => {
      this.personID = params["person_id"] ?? null;
      this.refresh();
    });
  }



  refresh() {
    this.getPersonById()
  }

  getPersonById(){
    if(this.personID){
      this.apiPerson.getPersonById(this.personID).subscribe({
        next:(data:any)=>{
          this.person = {
            PersonId: data.personID,
            IdNumber:data.idNumber, 
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
    const command: any = {
      person: {
        idNumber: this.person.IdNumber ? parseInt(this.person.IdNumber.toString()) : 0,
        firstName: this.person.FirstName ?? '',
        lastName: this.person.LastName ?? '',
        email: this.person.Email ?? '',
        phoneNumber: this.person.PhoneNumber?.toString() ?? '',
        activeInd: this.person.ActiveInd ?? false,
        dateOfBirth: this.person.DateOfBirth ? new Date(this.person.DateOfBirth).toISOString() : new Date().toISOString()
      }
    };
  
    console.log("CreatePersonCommand:", command.person);
  
    if (!this.person.PersonId || this.person.PersonId === '') {
      this.apiPerson.addNewPerson(command.person).subscribe({
        next: (response: any) => {
          this.messageService.add({severity: 'success', summary: 'Person added successfully'});
        },
        error: (error: Error) => {
          this.messageService.add({severity: 'error', summary: 'Error occurred', detail: error.message});
        }
      });
    } else {
      this.apiPerson.editPerson(command).subscribe({
        next: (response: any) => {
          this.messageService.add({severity: 'success', summary: 'Person updated successfully'});
        },
        error: (error: Error) => {
          this.messageService.add({severity: 'error', summary: 'Error occurred', detail: error.message});
        }
      });
    }
  }

  navigateToDetails(): void {
    if (this.person.PersonId) {
      this.router.navigate(['/accounts-list', this.person.PersonId]);
    }
  }

}
