import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Account, CreateAccountCommand } from '../interfaces/Accounts-models';
import { ApiAccountsService } from '../services/api-accounts.service';
import { AuthenticationService } from '../services/authentication.service';
import { LocalStorageService } from '../services/local-storage.service';
import { UserServiceService } from '../services/user-service.service';

@Component({
  selector: 'app-accounts-details',
  templateUrl: './accounts-details.component.html',
  styleUrls: ['./accounts-details.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class AccountsDetailsComponent implements OnInit, OnDestroy {
  accountID: string | null = null;
  personID: string | null = null;
  createdAccountId: string = '';
  isAdmin: boolean = false;
  user: any;
  userId: number | null = null;
  userName: string | null = null;
  userRole: string | null = null;
  
  public accountTypes: any[] = [
    { label: 'Checking', value: 'Checking' },
    { label: 'Savings', value: 'Savings' },
    { label: 'Business', value: 'Business' },
    { label: 'Investment', value: 'Investment' }
  ];

  // Form for validation
  accountForm: FormGroup;
  loading = false;
  isEditMode = false;
  transactionCount = 0;
  lastTransactionDate: Date | null = null;
  
  private routeSub: Subscription | undefined;
  private userSub: Subscription | undefined;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private activateRoutes: ActivatedRoute,
    private authService: AuthenticationService,
    private confirmationService: ConfirmationService,
    private apiAccount: ApiAccountsService,
    private fb: FormBuilder,
    private userService: UserServiceService
  ) {
    // Initialize form
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkUserRole();
    
    this.routeSub = this.activateRoutes.queryParams.subscribe(params => {
      this.accountID = params["account_id"] ?? null;
      this.personID = params["person_id"] ?? null;
      
      if (this.accountID) {
        this.isEditMode = true;
      }
      
      this.refresh();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      accountNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10,20}$')
      ]],
      accountType: ['', Validators.required],
      balance: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      status: [false],
      activeInd: [true]
    });
  }

  checkUserRole(): void {
    const userData = this.userService.currentUserValue;
    
    if (userData) {
      this.user = userData;
      this.userId = userData.id || userData.userId;
      this.userName = `${userData.firstName} ${userData.lastName}`;
      this.userRole = userData.role;
      this.isAdmin = userData.role === 'Admin';
    }

    this.userSub = this.userService.currentUser.subscribe(user => {
      if (user) {
        this.user = user;
        this.userId = user.id || user.userId;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userRole = user.role;
        this.isAdmin = user.role === 'Admin';
      }
    });
  }

  refresh(): void {
    if (this.accountID) {
      this.getAccountDetailsbyId();
      this.getTransactionSummary();
    } else {
      this.resetForm();
    }
  }

  getAccountDetailsbyId(): void {
    if (!this.accountID) {
      this.resetForm();
      return;
    }

    this.loading = true;
    this.apiAccount.getAccountById(this.accountID).subscribe({
      next: (data: Account) => {
        this.patchFormValues(data);
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load account details'
        });
        this.loading = false;
        console.error('Error loading account:', error);
      }
    });
  }

  private patchFormValues(account: Account): void {
    this.accountForm.patchValue({
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance,
      status: account.status,
      activeInd: account.activeInd
    });

    if (this.isEditMode) {
      this.accountForm.get('accountNumber')?.disable();
      this.accountForm.get('accountType')?.disable();
      this.accountForm.get('balance')?.disable();
    }
  }

  private resetForm(): void {
    this.accountForm.reset({
      accountNumber: '',
      accountType: '',
      balance: 0,
      status: false,
      activeInd: true
    });
    
    this.accountForm.get('accountNumber')?.enable();
    this.accountForm.get('accountType')?.enable();
    this.accountForm.get('balance')?.enable();
  }

  getTransactionSummary(): void {
    // Implement based on your transaction service
  }

  navigateToDetails(): void {
    if (this.personID) {
      this.router.navigate(['/person-details'], { 
        queryParams: { person_id: this.personID } 
      });
    } else {
      this.router.navigate(['/accounts']);
    }
  }

  closeAccount(): void {
    if (!this.accountID) {
      return;
    }

    const isClosing = this.accountForm.get('status')?.value;
    const message = isClosing 
      ? 'Are you sure you want to close this account?'
      : 'Are you sure you want to reopen this account?';

    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Account Status Change',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (isClosing) {
          this.performCloseAccount();
        } else {
          this.performReopenAccount();
        }
      },
      reject: () => {
        this.accountForm.get('status')?.setValue(!isClosing, { emitEvent: false });
      }
    });
  }

  private performCloseAccount(): void {
    this.loading = true;
    this.apiAccount.closeAccount(this.accountID!).subscribe({
      next: (data: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success', 
          detail: 'Account successfully closed'
        });
        this.refresh();
        this.loading = false;
      },
      error: (error) => {
        this.accountForm.get('status')?.setValue(false, { emitEvent: false });
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to close account'
        });
        this.loading = false;
        console.error('Error closing account:', error);
      }
    });
  }

  private performReopenAccount(): void {
    this.loading = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Reopen API not yet implemented'
    });
    this.loading = false;
  }

  deactivateAccount(): void {
    if (!this.accountID) {
      return;
    }

    if (!this.isAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'Only administrators can deactivate accounts'
      });
      this.accountForm.get('activeInd')?.setValue(true, { emitEvent: false });
      return;
    }

    const isDeactivating = !this.accountForm.get('activeInd')?.value;
    const message = isDeactivating
      ? 'Are you sure you want to permanently deactivate this account? This action cannot be undone.'
      : 'Are you sure you want to reactivate this account?';

    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.performDeactivateAccount(isDeactivating);
      },
      reject: () => {
        this.accountForm.get('activeInd')?.setValue(!isDeactivating, { emitEvent: false });
      }
    });
  }

  private performDeactivateAccount(isDeactivating: boolean): void {
    this.loading = true;
    
    if (isDeactivating) {
      this.apiAccount.deactivateAccount(this.accountID!).subscribe({
        next: (data: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Account successfully deactivated'
          });
          this.refresh();
          this.loading = false;
        },
        error: (error) => {
          this.accountForm.get('activeInd')?.setValue(true, { emitEvent: false });
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to deactivate account'
          });
          this.loading = false;
          console.error('Error deactivating account:', error);
        }
      });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Reactivate API not yet implemented'
      });
      this.loading = false;
    }
  }

  createAccount(): void {
    console.log('=== CREATE ACCOUNT DEBUG ===');
    console.log('personID:', this.personID);
    console.log('Form valid:', this.accountForm.valid);
    console.log('Form value:', this.accountForm.value);
    console.log('Form raw value:', this.accountForm.getRawValue());
    
    if (!this.personID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Person ID is required to create an account'
      });
      return;
    }

    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.accountForm);

    if (!this.accountForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      
      // Log validation errors
      Object.keys(this.accountForm.controls).forEach(key => {
        const control = this.accountForm.get(key);
        if (control?.errors) {
          console.log(`${key} errors:`, control.errors);
        }
      });
      return;
    }

    const formValues = this.accountForm.getRawValue();
    
    const command: CreateAccountCommand = {
      PersonId: this.personID,
      AccountNumber: formValues.accountNumber,
      AccountType: formValues.accountType,
      Balance: Number(formValues.balance),
      IsClosed: formValues.status,
      ActiveInd: formValues.activeInd
    };

    console.log('Sending command:', JSON.stringify(command, null, 2));

    this.loading = true;
    this.apiAccount.createAccount(command).subscribe({
      next: (data: string) => {
        this.createdAccountId = data;
        console.log('Account created with ID:', data);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Account successfully created'
        });
        
        this.accountID = data;
        this.isEditMode = true;
        
        // Navigate to edit mode with the new account ID
        this.router.navigate([], {
          relativeTo: this.activateRoutes,
          queryParams: { 
            account_id: data,
            person_id: this.personID 
          },
          queryParamsHandling: 'merge'
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating account:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || error.message || 'Failed to create account'
        });
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get f() {
    return this.accountForm.controls;
  }

  // Expose account property for the template
  get account() {
    const formValues = this.accountForm.getRawValue();
    return {
      accountID: this.accountID || '',
      accountNumber: formValues.accountNumber,
      accountType: formValues.accountType,
      balance: formValues.balance,
      status: formValues.status,
      activeInd: formValues.activeInd,
      personID: this.personID || ''
    };
  }
}