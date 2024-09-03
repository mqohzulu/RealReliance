import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  items: MenuItem[] | undefined;
  constructor(private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService) {

  }

  user: any | null = this.authService.getUser();
  isAuthenticated = this.user != null;
  private authSubscription: any;
  email: string = '';
  password: string = '';
  redirectUrl: string = '';

  ngOnInit(): void {

    this.authService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      this.user = this.authService.getUser();
      isAuthenticated = this.user != null;
    })
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirectUrl'] || '/home';
    });
  }


  login(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.router.navigateByUrl(this.redirectUrl);
        window.location.reload();
      },
      error:(err:any)=> {
        this.email = '';
        this.password = '';
      },
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

  }
  navigateToRegister(){
      this.router.navigate(['/register']);
 
  }

}
