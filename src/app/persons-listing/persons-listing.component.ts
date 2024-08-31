import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { Person } from '../interfaces/persons-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ApiPersonService } from '../services/api-person.service';

@Component({
  selector: 'app-persons-listing',
  templateUrl: './persons-listing.component.html',
  styleUrls: ['./persons-listing.component.css']
})
export class PersonsListingComponent implements OnInit {
  personWithAccountCount: any;
  constructor(private router: Router, 
    private api: ApiPersonService, 
    private messageService:MessageService,
     private confirmationService: ConfirmationService) { }

  active_only: boolean = true;
  search: any;

  @ViewChild('dt1') dt: Table | undefined;
  persons: Person[] = [];

  ngOnInit(): void {
    this.refresh()
  }
  refresh() {
    this.getPersonsList();
  }
  getPersonsList() {
    this.api.getPersonsList(this.active_only).subscribe({
      next: (response: any) => {
        this.persons = response;
        console.log("🚀 ~ PersonsListComponent ~ this.api.getPersonsList ~ this.persons:", this.persons)
      }
    })
  }

  openEdit(person_id: string): void {
    this.router.navigate(['/person-details'], { queryParams: { person_id } });
  }


  applyFilterGlobal($event: any, stringVal: any) {
    this.dt!.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }
  clear() {

  }
  addPerson() {
    this.router.navigateByUrl(`/person-details`);
  }
  getPersonAccountByIdAccountCount(id: number){
    this.api.getPersonByIdNumberAccountCount(id).subscribe({
      next:(data:any)=>{
        this.personWithAccountCount = data;
        console.log("🚀 ~ PersonsListComponent ~ this.api.getPersonByIdNumberAccountCount ~   this.personWithAccountCount :",   this.personWithAccountCount )
      }
    })
  }
  deactivate(personID: any) {
    this.getPersonAccountByIdAccountCount(personID);

    if(this.personWithAccountCount){
      this.messageService.add({severity:'error',summary:'unable to deactivate', detail:'Person still has unresolved accounts'});
      return;
    }
    this.confirmationService.confirm({
      message: 'Are you sure you want to deactivate this person?',
      icon: 'pi pi-trash',
      accept: () => {
       this.api.deletePerson(personID).subscribe({
        next:()=>{
           this.messageService.add({ severity: 'info', summary: 'successfully deleted person' });
           this.refresh();
        }
       })
       
      },
      reject: () => {
      }
    });
  }

}
