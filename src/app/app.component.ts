import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'RealReliance';
  menuItems: MenuItem[] | undefined;
  pageName: string = "";
  authenticated: boolean = false;
  user: any;
  menuChanged: boolean | undefined;

  constructor(@Inject('ENVIRONMENT') private environment: any, private authService: AuthenticationService,
    private router: Router, private confirmationService: ConfirmationService, private messageService: MessageService) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.authenticated = this.authService.isAuthenticated();
    if (this.authenticated) {

      this.buildMenu();
    } else {
      this.clearMenu();
    }
  }

  buildMenu(): void {
    if (this.authenticated) {
      this.menuChanged = this.authenticated
    } else {
      return;
    }
    this.menuItems = [
      { label: "Home", icon: "pi pi-home", iconStyle: { color: "#0189b5" }, routerLink: ["/home"] },
      { label: "Persons", icon: "pi pi-users", iconStyle: { color: "#0189b5" }, routerLink: ["/person-list"] },
      { label: "About", icon: "pi pi-info-circle", iconStyle: { color: "#0189b5" }, routerLink: ["/about"] },
      { label: "Contact", icon: "pi pi-envelope", iconStyle: { color: "#0189b5" }, routerLink: ["/contact"] },
      { label: "LogOut", icon: "pi pi-sign-out", iconStyle: { color: "#ff0000" }, command: () => this.logOut() }
    ];

    console.log(this.menuItems)
  }


  logOut(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to log out?',
      icon: 'pi pi-sign-out',
      accept: () => {
        this.messageService.add({ severity: 'info', summary: 'successfully Logged user out' });
        this.authService.logout();
        this.clearMenu();
        this.authenticated = false;
      },
      reject: () => {
      }
    });

  }
  private clearMenu(): void {
    this.menuItems = [];
  }
  onBuildMenu(): void {
    this.buildMenu();
  }
}
