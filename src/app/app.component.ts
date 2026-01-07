import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AuthenticationService } from './services/authentication.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'RealReliance Bank';
  menuItems: MenuItem[] = [];
  authenticated: boolean = false;
  user: any;
  private authSubscription: Subscription | undefined;
  private routerSubscription: Subscription | undefined;
  isAdmin: boolean = false;
  userName: string = '';

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuthenticated => {
        this.authenticated = isAuthenticated;
        this.user = this.authService.getUser();
        this.userName = this.user?.name || this.user?.email || 'User';
        
        if (this.authenticated) {
          this.buildMenu();
        } else {
          this.clearMenu();
          this.redirectToLogin(); 
        }
      }
    );

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkAuthentication();
    });
  }

  private checkAuthentication(): void {
    this.authenticated = this.authService.isAuthenticated();
    this.user = this.authService.getUser();
    this.userName = this.user?.name || this.user?.email || 'User';
    
    if (this.authenticated) {
      this.buildMenu();
    } else {
      this.clearMenu();
      if (!this.router.url.includes('/login')) {
        this.redirectToLogin();
      }
    }
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private buildMenu(): void {
    this.isAdmin = this.user?.role === 'Admin';
    this.menuItems = [
      { 
        label: "Home", 
        icon: "pi pi-home", 
        iconStyle: { color: "#0189b5" }, 
        routerLink: ["/home"] 
      },
      { 
        label: "Persons", 
        visible: this.isAdmin, 
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

  private clearMenu(): void {
    this.menuItems = [];
  }

  logOut(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to log out?',
      icon: 'pi pi-sign-out',
      accept: () => {
        this.authService.logout();
        this.clearMenu();
        this.authenticated = false;
        this.user = null;
        this.userName = '';
        this.router.navigate(['/login']).then(() => {
        });
      },
      reject: () => {
      }
    });
  }
}