import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
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
  searchCriteria: string = 'all';

  @ViewChild('dt1') dt: Table | undefined;
  persons: any[] = [];
  filteredPersons: any[] = [];

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
          return person.idNumber?.toString().toLowerCase().includes(query);
        
        case 'surname':
          return person.lastName?.toLowerCase().includes(query);
        
        case 'accountNumber':
          return person.accounts?.some((account: any) => 
            account.accountNumber?.toLowerCase().includes(query)
          ) || false;
        
        case 'all':
        default:
          const matchesId = person.idNumber?.toString().toLowerCase().includes(query);
          const matchesSurname = person.lastName?.toLowerCase().includes(query);
          const matchesFirstName = person.firstName?.toLowerCase().includes(query);
          const matchesEmail = person.email?.toLowerCase().includes(query);
          const matchesPhone = person.phoneNumber?.toLowerCase().includes(query);
          const matchesAccount = person.accounts?.some((account: any) => 
            account.accountNumber?.toLowerCase().includes(query)
          ) || false;
          
          return matchesId || matchesSurname || matchesFirstName || 
                 matchesEmail || matchesPhone || matchesAccount;
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
      }
    });
  }

  deactivate(personID: any, idNumber: any) {
    this.api.getPersonById(personID).subscribe({
      next: (person: any) => {
        if (!person) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Person not found'
          });
          return;
        }
        const accounts = person.accounts;

        if (accounts.length === 0) {
          this.confirmDelete(idNumber, 'This person has no accounts.');
          return;
        }

        const hasOpenAccounts = accounts.some((account: any) => account.status === false);

        if (hasOpenAccounts) {
          this.messageService.add({
            severity: 'error',
            summary: 'Cannot Delete Person',
            detail: 'This person has open accounts. Please close all accounts before deleting the person.',
            life: 5000
          });
          return;
        }

        this.confirmDelete(idNumber, 'All accounts are closed.');
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch person details'
        });
      }
    });
  }

  confirmDelete(personID: any, message: string) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this person? ${message}`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePerson(personID).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Person deleted successfully'
            });
            this.refresh();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to delete person'
            });
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Deletion cancelled'
        });
      }
    });
  }
}