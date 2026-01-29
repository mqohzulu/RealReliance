import { Component, OnInit, ViewChild, DestroyRef, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';

import { MessageService } from 'primeng/api';

import { AuthenticationService } from '../services/authentication.service';
import { AppStateService } from '../services/app-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface PasswordValidation {
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  minLength: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginForm') loginNgForm!: NgForm;
  @ViewChild('registerForm') registerNgForm!: NgForm;

  private readonly destroyRef = inject(DestroyRef);

  readonly roles = [
    { label: 'Customer', value: 'Customer' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Manager', value: 'Manager' }
  ];

  email = '';
  password = '';

  firstName = '';
  lastName = '';
  registerEmail = '';
  registerPassword = '';
  confirmPassword = '';
  selectedRole = '';
  acceptTerms = false;
  isAuthenticated = false;
  isLoading = false;
  isRegisterMode = false;
  redirectUrl = '/home';
  
  passwordValidation: PasswordValidation = {
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    minLength: false
  };

  passwordStrength = 0;

  constructor(
    private authService: AuthenticationService,
    private appState: AppStateService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(take(1))
      .subscribe(params => {
        this.redirectUrl = params['redirectUrl'] || '/home';
      });

    this.appState.authenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          setTimeout(() => {
            this.router.navigate([this.redirectUrl]);
          }, 100);
        }
      });
  }

  toggleMode(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    if (isRegister) {
      this.updatePasswordValidation(this.registerPassword);
    }
  }

  login(): void {
    if (this.loginNgForm.invalid) {
      this.markFormAsTouched(this.loginNgForm);
      
      if (!this.email) {
        this.showError('Email is required');
        return;
      }
      
      if (!this.validateEmail(this.email)) {
        this.showError('Please enter a valid email address');
        return;
      }
      
      if (!this.password) {
        this.showError('Password is required');
        return;
      }
      
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        this.isLoading = false;
        this.email = '';
        this.password = '';
        this.router.navigateByUrl(this.redirectUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Invalid email or password');
        this.password = '';
      }
    });
  }

  register(): void {
    if (this.registerNgForm.invalid) {
      this.markFormAsTouched(this.registerNgForm);
      
      if (!this.firstName) {
        this.showError('First name is required');
        return;
      }
      
      if (!this.lastName) {
        this.showError('Last name is required');
        return;
      }
      
      if (!this.registerEmail) {
        this.showError('Email is required');
        return;
      }
      
      if (!this.validateEmail(this.registerEmail)) {
        this.showError('Please enter a valid email address');
        return;
      }
      
      if (!this.registerPassword) {
        this.showError('Password is required');
        return;
      }
      
      if (this.registerPassword.length < 8) {
        this.showError('Password must be at least 8 characters long');
        return;
      }
      
      if (!this.hasUpperCase(this.registerPassword)) {
        this.showError('Password must contain at least one uppercase letter');
        return;
      }
      
      if (!this.hasLowerCase(this.registerPassword)) {
        this.showError('Password must contain at least one lowercase letter');
        return;
      }
      
      if (!this.hasNumber(this.registerPassword)) {
        this.showError('Password must contain at least one number');
        return;
      }
      
      if (this.registerPassword !== this.confirmPassword) {
        this.showError('Passwords do not match');
        return;
      }
      
      if (!this.selectedRole) {
        this.showError('Please select a role');
        return;
      }
      
      if (!this.acceptTerms) {
        this.showError('You must accept the terms and conditions');
        return;
      }
      
      return;
    }

    this.isLoading = true;

    this.authService.register(
      this.registerEmail,
      this.registerPassword,
      this.firstName,
      this.lastName,
      this.selectedRole
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('Registration successful! Please login.');
        this.toggleMode(false);
        this.email = this.registerEmail;
        this.clearRegisterForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  forgotPassword(): void {
    const emailToUse = this.isRegisterMode ? this.registerEmail : this.email;
    
    if (!emailToUse) {
      this.showError('Please enter your email address');
      return;
    }
    
    if (!this.validateEmail(emailToUse)) {
      this.showError('Please enter a valid email address');
      return;
    }
    
    this.isLoading = true;
    
    this.authService.forgotPassword(emailToUse)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('If an account exists with this email, you will receive password reset instructions.');
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Failed to process password reset request.');
      }
    });
  }

  checkPasswordStrength(): void {
    this.updatePasswordValidation(this.registerPassword);
    this.calculatePasswordStrength();
  }

  private calculatePasswordStrength(): void {
    const validation = this.passwordValidation;
    let strength = 0;
    
    if (validation.minLength) strength += 25;
    if (validation.hasUpperCase) strength += 25;
    if (validation.hasLowerCase) strength += 25;
    if (validation.hasNumber) strength += 15;
    if (validation.hasSpecialChar) strength += 10;
    
    this.passwordStrength = Math.min(strength, 100);
  }

  private updatePasswordValidation(password: string): void {
    this.passwordValidation = {
      hasUpperCase: this.hasUpperCase(password),
      hasLowerCase: this.hasLowerCase(password),
      hasNumber: this.hasNumber(password),
      hasSpecialChar: this.hasSpecialChar(password),
      minLength: password.length >= 8
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  hasUpperCase(str: string): boolean {
    return /[A-Z]/.test(str);
  }
  
  hasLowerCase(str: string): boolean {
    return /[a-z]/.test(str);
  }
  
  hasNumber(str: string): boolean {
    return /\d/.test(str);
  }
  
  hasSpecialChar(str: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);
  }

  getPasswordStrengthClass(): string {
    const strength = this.passwordStrength;
    if (strength < 30) return 'weak';
    if (strength < 60) return 'fair';
    if (strength < 80) return 'good';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.passwordStrength;
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  }

  private clearRegisterForm(): void {
    this.firstName = '';
    this.lastName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.confirmPassword = '';
    this.selectedRole = '';
    this.acceptTerms = false;
    this.passwordValidation = {
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      minLength: false
    };
    this.passwordStrength = 0;
  }

  showTerms(): void {
    this.showInfo('Terms and conditions would be displayed here');
  }

  showPrivacy(): void {
    this.showInfo('Privacy policy would be displayed here');
  }

  private markFormAsTouched(form: NgForm): void {
    if (form.controls) {
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });
    }
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000
    });
  }
  
  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000
    });
  }
  
  private showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message,
      life: 3000
    });
  }

}
