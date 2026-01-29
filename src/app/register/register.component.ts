import { Component, DestroyRef, inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly destroyRef = inject(DestroyRef);
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
      this.authService.register(this.email, this.password,this.firstName,this.lastName, this.selectedRole)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
