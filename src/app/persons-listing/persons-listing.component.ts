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
  active_only: boolean = true;
  searchQuery: string = '';
  searchCriteria: string = 'all'; // 'all', 'idNumber', 'surname', 'accountNumber'

  @ViewChild('dt1') dt: Table | undefined;
  persons: Person[] = [];
  filteredPersons: Person[] = [];

  constructor(
    private router: Router, 
    private api: ApiPersonService, 
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.getPersonsList();
  }

  getPersonsList() {
    this.api.getPersonsList(this.active_only).subscribe({
      next: (response: any) => {
        this.persons = response;
        this.filteredPersons = response;
        this.applySearch();
        console.log("🚀 ~ PersonsListComponent ~ this.api.getPersonsList ~ this.persons:", this.persons);
      }
    });
  }

  applySearch() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredPersons = [...this.persons];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();

    this.filteredPersons = this.persons.filter(person => {
      switch (this.searchCriteria) {
        case 'idNumber':
          return person.IdNumber?.toString().toLowerCase().includes(query);
        
        case 'surname':
          return person.LastName?.toLowerCase().includes(query);
        
        case 'accountNumber':
          return person.Accounts?.some(account => 
            account.accountNumber?.toLowerCase().includes(query)
          ) || false;
        
        case 'all':
        default:
          const matchesId = person.IdNumber?.toString().toLowerCase().includes(query);
          const matchesSurname = person.LastName?.toLowerCase().includes(query);
          const matchesAccount = person.Accounts?.some(account => 
            account.accountNumber?.toLowerCase().includes(query)
          ) || false;
          
          return matchesId || matchesSurname || matchesAccount;
      }
    });
  }

  onSearchChange() {
    this.applySearch();
  }

  openEdit(person_id: string): void {
    this.router.navigate(['/person-details'], { queryParams: { person_id } });
  }

  clear() {
    this.searchQuery = '';
    this.searchCriteria = 'all';
    this.applySearch();
  }

  addPerson() {
    this.router.navigateByUrl(`/person-details`);
  }

  getPersonAccountByIdAccountCount(id: number) {
    this.api.getPersonByIdNumberAccountCount(id).subscribe({
      next: (data: any) => {
        this.personWithAccountCount = data;
        console.log("🚀 ~ PersonsListComponent ~ this.api.getPersonByIdNumberAccountCount ~ this.personWithAccountCount:", this.personWithAccountCount);
      }
    });
  }

  deactivate(personID: any) {
    this.getPersonAccountByIdAccountCount(personID);

    if (this.personWithAccountCount) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to deactivate',
        detail: 'Person still has unresolved accounts'
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to deactivate this person?',
      icon: 'pi pi-trash',
      accept: () => {
        this.api.deletePerson(personID).subscribe({
          next: () => {
            this.messageService.add({ 
              severity: 'info', 
              summary: 'Successfully deleted person' 
            });
            this.refresh();
          }
        });
      },
      reject: () => {}
    });
  }
}