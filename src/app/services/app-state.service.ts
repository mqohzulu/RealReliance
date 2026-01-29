import { Injectable, computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

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
  private readonly state = signal<AppState>({
    authenticated: false,
    user: null,
    isAdmin: false,
    userName: ''
  });

  readonly state$ = toObservable(this.state);
  readonly authenticated = computed(() => this.state().authenticated);
  readonly user = computed(() => this.state().user);
  readonly isAdmin = computed(() => this.state().isAdmin);
  readonly userName = computed(() => this.state().userName);

  readonly authenticated$ = toObservable(this.authenticated);
  readonly user$ = toObservable(this.user);
  readonly isAdmin$ = toObservable(this.isAdmin);
  readonly userName$ = toObservable(this.userName);

  updateState(partialState: Partial<AppState>): void {
    this.state.update(current => ({ ...current, ...partialState }));
  }
}
