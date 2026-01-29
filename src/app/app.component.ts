// app.component.ts
import { Component, OnInit, computed, DestroyRef, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AuthenticationService } from './services/authentication.service';
import { AppStateService } from './services/app-state.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'RealReliance Bank';
  private readonly destroyRef = inject(DestroyRef);

  readonly vm = computed(() => ({
    authenticated: this.appState.authenticated(),
    user: this.appState.user(),
    isAdmin: this.appState.isAdmin(),
    userName: this.appState.userName()
  }));

  readonly menuItems = computed<MenuItem[]>(() => this.buildMenu(this.vm()));

  constructor(
    private authService: AuthenticationService,
    private appState: AppStateService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isAuthenticated => {
        const user = isAuthenticated ? this.authService.getUser() : null;
        this.appState.updateState({
          authenticated: isAuthenticated,
          user,
          isAdmin: user?.role === 'Admin',
          userName: user?.name || user?.email || ''
        });
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (!this.vm().authenticated && !this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      });

    const initialAuth = this.authService.isAuthenticated();
    const user = initialAuth ? this.authService.getUser() : null;
    this.appState.updateState({
      authenticated: initialAuth,
      user,
      isAdmin: user?.role === 'Admin',
      userName: user?.name || user?.email || ''
    });
  }

  private buildMenu(vm: { authenticated: boolean; isAdmin: boolean }): MenuItem[] {
    if (!vm.authenticated) return [];

    return [
      { 
        label: "Home", 
        icon: "pi pi-home", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/home"] 
      },
      { 
        label: "Persons", 
        visible: vm.isAdmin, 
        icon: "pi pi-users", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/person-list"] 
      },
      { 
        label: "My Profile", 
        icon: "pi pi-user", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/person-details/my-profile"] 
      },
      { 
        label: "About", 
        icon: "pi pi-info-circle", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/about"] 
      },
      { 
        label: "Contact", 
        icon: "pi pi-envelope", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/contact"] 
      },
      { 
        label: "LogOut", 
        icon: "pi pi-sign-out", 
        iconStyle: { color: "#ff0000" }, 
        command: () => this.logOut() 
      }
    ];
  }

  logOut(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to log out?',
      icon: 'pi pi-sign-out',
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

}
