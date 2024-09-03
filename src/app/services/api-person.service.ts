import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { CreatePersonCommand } from '../interfaces/persons-models';

@Injectable({
  providedIn: 'root'
})
export class ApiPersonService {

  constructor(private messageService:MessageService, private api:ApiService) { }
  addNewPerson(person: CreatePersonCommand): Observable<any> {
    return new Observable(observer => {
      console.log(person)
      this.api.post<any>("Persons/AddNewPerson", person).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error adding new person', detail: error.error });
            observer.error(error);
            console.log(error);
          },
        }
      );
    }
    )
  };
  editPerson(model: any): Observable<any> {
    return new Observable(observer => {
      this.api.put<any>("Persons/EditPerson", { command: model }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error editing person', detail: error.error });
            observer.error(error);
          },
          complete: () => {
            observer.complete();
          }
        }
      );
    });
  }
  deactivatePerson(personId: any): Observable<any> {
    return new Observable(observer => {
      const payload = { personId: personId };  
      this.api.delete<any>("Persons/DeletePerson", payload).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error deactivating person', detail: error.error });
            observer.error(error);
          },
          complete: () => {
            observer.complete();
          }
        }
      );
    });
  }
  getPersonsList(activeOnly: boolean): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/GetPersons", { activeOnly: activeOnly }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting persons', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
  getPersonById(personId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/GetPersonById", { personId: personId }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting person', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
  getPersonByEmail(email: string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/GetPersonByEmail", { email: email }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting person', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
  getPersonByIdNumberAccountCount(idNumber: number): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/GetPersonByIdNumberAccountCount", { idNumber: idNumber }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error getting person', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
  deletePerson(personId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get<any>("Persons/DeletePerson", { personId: personId }).subscribe(
        {
          next: (response: any) => {
            observer.next(response);
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error deleting person', detail: error.error });
            observer.error(error);

          },
        }
      );
    }
    )
  };
}
