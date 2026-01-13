import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppState {
  authenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  userName: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'Admin' | 'User' | 'Customer';
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly state = new BehaviorSubject<AppState>({
    authenticated: false,
    user: null,
    isAdmin: false,
    userName: ''
  });

  readonly state$ = this.state.asObservable();
  readonly authenticated$ = this.state$.pipe(map(s => s.authenticated));
  readonly user$ = this.state$.pipe(map(s => s.user));
  readonly isAdmin$ = this.state$.pipe(map(s => s.isAdmin));
  readonly userName$ = this.state$.pipe(map(s => s.userName));

  updateState(partialState: Partial<AppState>): void {
    this.state.next({ ...this.state.value, ...partialState });
  }
}