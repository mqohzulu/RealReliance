import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  firstName: string = '';
  lastName: string = '';
  selectedRole: string = '';
  roles = [
    { name: 'Customer', value: 'Customer' },
    { name: 'Admin', value: 'Admin' }
  ];

  constructor(private authService: AuthenticationService, private router: Router) {}

  register() {
    if (this.email && this.password && this.selectedRole) {
      this.authService.register(this.email, this.password,this.firstName,this.lastName, this.selectedRole).subscribe({
        next: (response) => {
          this.router.navigate(['/home']);
        },
        error: (error) => {
          
        }
      });
    } else {

    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
