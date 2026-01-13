// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AuthenticationService } from './services/authentication.service';
import { AppStateService, User } from './services/app-state.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'RealReliance Bank';
  menuItems: MenuItem[] = [];
  
  private subscriptions = new Subscription();
  
  vm = {
    authenticated: false,
    user: null as User | null,
    isAdmin: false,
    userName: ''
  };

  constructor(
    private authService: AuthenticationService,
    private appState: AppStateService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.appState.state$.subscribe(state => {
        this.vm = { ...state };
        this.menuItems = this.buildMenu();
      })
    );

    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe(isAuthenticated => {
        const user = isAuthenticated ? this.authService.getUser() : null;
        this.appState.updateState({
          authenticated: isAuthenticated,
          user,
          isAdmin: user?.role === 'Admin',
          userName: user?.name || user?.email || ''
        });
      })
    );

    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (!this.vm.authenticated && !this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      })
    );

    const initialAuth = this.authService.isAuthenticated();
    const user = initialAuth ? this.authService.getUser() : null;
    this.appState.updateState({
      authenticated: initialAuth,
      user,
      isAdmin: user?.role === 'Admin',
      userName: user?.name || user?.email || ''
    });
  }

  private buildMenu(): MenuItem[] {
    if (!this.vm.authenticated) return [];

    return [
      { 
        label: "Home", 
        icon: "pi pi-home", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/home"] 
      },
      { 
        label: "Persons", 
        visible: this.vm.isAdmin, 
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}