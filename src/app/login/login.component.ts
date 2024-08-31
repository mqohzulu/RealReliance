import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
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
    private messageService:MessageService){

    }

  user:any| null = this.authService.getUser();
  isAuthenticated = this.user != null;
  private authSubscription :any;
  email: string = '';
  password: string = '';

  ngOnInit(): void {

    this.authService.isAuthenticated$.subscribe((isAuthenticated:boolean)=>{
      this.user = this.authService.getUser();
      isAuthenticated = this.user !=null;
    })
  }

  
  login(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        if (this.user!=null) {
          this.router.navigate(['/home']);
        }
      }
    });
  }
  
  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

  }

}
