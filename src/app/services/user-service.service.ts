import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

   private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private localStorageService: LocalStorageService) {
    const storedUser = this.localStorageService.getItem('LogginUser');
    this.currentUserSubject = new BehaviorSubject<any>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  setUser(user: any) {
    this.localStorageService.setItem('LogginUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout() {
    this.localStorageService.removeItem('LogginUser');
    this.currentUserSubject.next(null);
  }
}
