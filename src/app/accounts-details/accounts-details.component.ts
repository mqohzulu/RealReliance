import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Account, CreateAccountCommand } from '../interfaces/Accounts-models';
import { ApiAccountsService } from '../services/api-accounts.service';
import { AuthenticationService } from '../services/authentication.service';

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
  
  public account: Account = {
    accountID: "",
    accountNumber: "",
    accountType: "",
    activeInd: true,
    balance: 0,
    personID: "",
    status: false
  };

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

  constructor(
    private messageService: MessageService,
    private router: Router,
    private activateRoutes: ActivatedRoute,
    private authService: AuthenticationService,
    private confirmationService: ConfirmationService,
    private apiAccount: ApiAccountsService,
    private fb: FormBuilder
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
  }

  private createForm(): FormGroup {
    return this.fb.group({
      accountNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10,20}$') // Adjust pattern as needed
      ]],
      accountType: ['', Validators.required],
      balance: [0, [
        Validators.required,
        Validators.min(0),
        Validators.pattern('^[0-9]+(\.[0-9]{1,2})?$')
      ]],
      status: [false],
      activeInd: [true]
    });
  }

  checkUserRole(): void {
    const user = this.authService.getUser();
    this.isAdmin = user === 'Admin' || user === 'admin';
  }

  refresh(): void {
    this.getAccountDetailsbyId();
    if (this.accountID) {
      this.getTransactionSummary();
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
        this.account = data;
        this.patchFormValues();
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

  private patchFormValues(): void {
    this.accountForm.patchValue({
      accountNumber: this.account.accountNumber,
      accountType: this.account.accountType,
      balance: this.account.balance,
      status: this.account.status,
      activeInd: this.account.activeInd
    });

    // Disable fields that shouldn't be edited
    if (this.isEditMode) {
      this.accountForm.get('accountNumber')?.disable();
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
    this.accountForm.get('balance')?.enable();
  }

  getTransactionSummary(): void {
    // Implement this method based on your transaction service
    // Example:
    // this.apiAccount.getTransactionSummary(this.accountID).subscribe({
    //   next: (summary) => {
    //     this.transactionCount = summary.count;
    //     this.lastTransactionDate = summary.lastTransactionDate;
    //   }
    // });
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Account ID is required'
      });
      return;
    }

    const isClosing = !this.account.status;
    const action = isClosing ? 'close' : 'reopen';
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
        // Revert the checkbox change
        this.account.status = !this.account.status;
        this.accountForm.get('status')?.setValue(!isClosing);
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
        // Revert on error
        this.account.status = false;
        this.accountForm.get('status')?.setValue(false);
        
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
    // this.apiAccount.reopenAccount(this.accountID!).subscribe({
    //   next: (data: any) => {
    //     this.messageService.add({
    //       severity: 'success',
    //       summary: 'Success', 
    //       detail: 'Account successfully reopened'
    //     });
    //     this.refresh();
    //     this.loading = false;
    //   },
    //   error: (error) => {
    //     // Revert on error
    //     this.account.status = true;
    //     this.accountForm.get('status')?.setValue(true);
        
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: error.error?.message || 'Failed to reopen account'
    //     });
    //     this.loading = false;
    //     console.error('Error reopening account:', error);
    //   }
    // });
    this.loading = false;
  }

  deactivateAccount(): void {
    if (!this.accountID) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Account ID is required'
      });
      return;
    }

    if (!this.isAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'Only administrators can deactivate accounts'
      });
      // Revert the checkbox
      this.account.activeInd = true;
      this.accountForm.get('activeInd')?.setValue(true);
      return;
    }

    const isDeactivating = !this.account.activeInd;
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
        // Revert the checkbox change
        this.account.activeInd = !isDeactivating;
        this.accountForm.get('activeInd')?.setValue(!isDeactivating);
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
          // Revert on error
          this.account.activeInd = true;
          this.accountForm.get('activeInd')?.setValue(true);
          
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
      // Implement reactivate method if available
      // this.apiAccount.reactivateAccount(this.accountID!).subscribe({
      //   next: (data: any) => {
      //     this.messageService.add({
      //       severity: 'success',
      //       summary: 'Success',
      //       detail: 'Account successfully reactivated'
      //     });
      //     this.refresh();
      //     this.loading = false;
      //   },
      //   error: (error) => {
      //     // Revert on error
      //     this.account.activeInd = false;
      //     this.accountForm.get('activeInd')?.setValue(false);
          
      //     this.messageService.add({
      //       severity: 'error',
      //       summary: 'Error',
      //       detail: error.error?.message || 'Failed to reactivate account'
      //     });
      //     this.loading = false;
      //     console.error('Error reactivating account:', error);
      //   }
      // });
    }
  }

  isFormValid(): boolean {
    if (this.isEditMode) {
      // For edit mode, only status and activeInd might be editable
      return this.accountForm.get('accountType')?.valid || true;
    }
    
    return this.accountForm.valid;
  }

  createAccount(): void {
    if (!this.personID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Person ID is required to create an account'
      });
      return;
    }

    if (!this.accountForm.valid) {
      this.markFormGroupTouched(this.accountForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly'
      });
      return;
    }

    const formValues = this.accountForm.getRawValue();
    
    const command: CreateAccountCommand = {
      PersonId: this.personID,
      AccountNumber: formValues.accountNumber,
      AccountType: formValues.accountType,
      Balance: formValues.balance,
      IsClosed: formValues.status,
      ActiveInd: formValues.activeInd
    };

    this.loading = true;
    this.apiAccount.createAccount(command).subscribe({
      next: (data: string) => {
        this.createdAccountId = data;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Account successfully created'
        });
        
        // Update local account with new ID
        this.accountID = data;
        this.isEditMode = true;
        
        // Refresh to load the newly created account
        this.refresh();
        
        // Enable disabled fields for edit mode
        this.accountForm.get('accountNumber')?.disable();
        this.accountForm.get('balance')?.disable();
        
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to create account'
        });
        this.loading = false;
        console.error('Error creating account:', error);
      }
    });
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getter for form controls (for template access)
  get f() {
    return this.accountForm.controls;
  }

  // Helper methods for template
  getAccountNumberError(): string {
    const control = this.accountForm.get('accountNumber');
    if (control?.errors?.['required']) return 'Account number is required';
    if (control?.errors?.['pattern']) return 'Invalid account number format';
    return '';
  }

  getBalanceError(): string {
    const control = this.accountForm.get('balance');
    if (control?.errors?.['required']) return 'Balance is required';
    if (control?.errors?.['min']) return 'Balance cannot be negative';
    if (control?.errors?.['pattern']) return 'Invalid balance format';
    return '';
  }

  // Additional helper methods
  getAccountTypeLabel(type: string): string {
    const found = this.accountTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(balance);
  }

  // Method to handle form submission from template
  onSubmit(): void {
    if (this.isEditMode) {
      this.updateAccount();
    } else {
      this.createAccount();
    }
  }

  updateAccount(): void {
    // Implement update logic if needed
    // This would require an updateAccount API method
    console.log('Update account logic would go here');
  }
}