import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  items: MenuItem[] | undefined;
  
  email: string = '';
  password: string = '';
  isAuthenticated = false;
  redirectUrl: string = '';
  isLoading = false;
  
  isRegisterMode = false;
  firstName: string = '';
  lastName: string = '';
  registerEmail: string = '';
  registerPassword: string = '';
  confirmPassword: string = '';
  selectedRole: string = '';
  acceptTerms: boolean = false;
  
  passwordStrength: number = 0;

  roles = [
    { label: 'Customer', value: 'Customer' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Manager', value: 'Manager' }
  ];
  
  private authSubscription: Subscription | undefined;
  private user: any | null = null;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.isAuthenticated = this.user != null;
    
    this.authSubscription = this.authService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      this.user = this.authService.getUser();
      this.isAuthenticated = this.user != null;
    });
    
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirectUrl'] || '/home';
    });
    
    this.items = [
      { label: 'Home', routerLink: '/home' },
      { label: 'Login', routerLink: '/login' }
    ];
  }

  toggleMode(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    this.resetForm();
  }

  private resetForm(): void {
    this.passwordStrength = 0;
  }

  login(): void {
    if (!this.email || !this.password) {
      this.showError('Please enter both email and password');
      return;
    }
    
    if (!this.validateEmail(this.email)) {
      this.showError('Please enter a valid email address');
      return;
    }
    
    this.isLoading = true;
    
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
       // this.showSuccess('Login successful!');
        
        const targetUrl = this.redirectUrl || '/home';
        setTimeout(() => {
          this.router.navigateByUrl(targetUrl);
        }, 500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showError(err.error?.message || 'Invalid email or password');
        this.password = '';
      }
    });
  }

  register(): void {
    if (!this.validateRegistration()) {
      return;
    }
    
    this.isLoading = true;
    
    this.authService.register(
      this.registerEmail, 
      this.registerPassword,
      this.firstName,
      this.lastName, 
      this.selectedRole
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showSuccess('Registration successful! Please login.');
        
        this.isRegisterMode = false;
        this.email = this.registerEmail;
        
        this.clearRegisterForm();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  private validateRegistration(): boolean {
    if (!this.firstName || !this.lastName) {
      this.showError('First name and last name are required');
      return false;
    }
    
    if (!this.registerEmail) {
      this.showError('Email is required');
      return false;
    }
    
    if (!this.validateEmail(this.registerEmail)) {
      this.showError('Please enter a valid email address');
      return false;
    }
    
    if (!this.registerPassword) {
      this.showError('Password is required');
      return false;
    }
    
    if (this.registerPassword.length < 8) {
      this.showError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!this.hasUpperCase(this.registerPassword)) {
      this.showError('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!this.hasLowerCase(this.registerPassword)) {
      this.showError('Password must contain at least one lowercase letter');
      return false;
    }
    
    if (!this.hasNumber(this.registerPassword)) {
      this.showError('Password must contain at least one number');
      return false;
    }
    
    if (this.registerPassword !== this.confirmPassword) {
      this.showError('Passwords do not match');
      return false;
    }
    
    if (!this.selectedRole) {
      this.showError('Please select a role');
      return false;
    }
    
    if (!this.acceptTerms) {
      this.showError('You must accept the terms and conditions');
      return false;
    }
    
    return true;
  }

  checkPasswordStrength(): void {
    let strength = 0;
    
    if (this.registerPassword.length >= 8) strength += 25;
    if (this.hasUpperCase(this.registerPassword)) strength += 25;
    if (this.hasLowerCase(this.registerPassword)) strength += 25;
    if (this.hasNumber(this.registerPassword)) strength += 15;
    if (this.hasSpecialChar(this.registerPassword)) strength += 10;
    
    this.passwordStrength = Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 30) return 'weak';
    if (this.passwordStrength < 60) return 'fair';
    if (this.passwordStrength < 80) return 'good';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 30) return 'Weak';
    if (this.passwordStrength < 60) return 'Fair';
    if (this.passwordStrength < 80) return 'Good';
    return 'Strong';
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

  private clearRegisterForm(): void {
    this.firstName = '';
    this.lastName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.confirmPassword = '';
    this.selectedRole = '';
    this.acceptTerms = false;
    this.passwordStrength = 0;
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
    
    this.authService.forgotPassword(emailToUse).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showSuccess('If an account exists with this email, you will receive password reset instructions.');
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showError(error.error?.message || 'Failed to process password reset request.');
      }
    });
  }

  loginWithGoogle(): void {
    this.showInfo('Google login integration would be implemented here');
  }
  
  loginWithMicrosoft(): void {
    this.showInfo('Microsoft login integration would be implemented here');
  }

  showTerms(): void {
    this.showInfo('Terms and conditions would be displayed here');
  }

  showPrivacy(): void {
    this.showInfo('Privacy policy would be displayed here');
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

  isLoginFormValid(): boolean {
    return !!this.email && !!this.password && this.validateEmail(this.email);
  }

  isRegisterFormValid(): boolean {
    return !!this.firstName && 
           !!this.lastName && 
           !!this.registerEmail && 
           this.validateEmail(this.registerEmail) &&
           !!this.registerPassword && 
           this.registerPassword.length >= 8 &&
           this.hasUpperCase(this.registerPassword) &&
           this.hasLowerCase(this.registerPassword) &&
           this.hasNumber(this.registerPassword) &&
           this.registerPassword === this.confirmPassword &&
           !!this.selectedRole &&
           this.acceptTerms;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}