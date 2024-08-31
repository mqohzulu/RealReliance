import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AboutComponent } from './about/about.component';
import { ContactsComponent } from './contacts/contacts.component';
import { PersonsDetailsComponent } from './persons-details/persons-details.component';
import { TransactionListingComponent } from './transaction-listing/transaction-listing.component';
import { PersonsListingComponent } from './persons-listing/persons-listing.component';
import { AccountsDetailsComponent } from './accounts-details/accounts-details.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [

  { path: 'login', component: LoginComponent },
  //{ path: 'home', component: HomeComponent, canActivate:[AuthGuard]},
  { path: 'about', component: AboutComponent, canActivate:[AuthGuard] },
  { path: 'contact', component: ContactsComponent, canActivate:[AuthGuard] },
  { path: 'person', component: PersonsDetailsComponent, canActivate:[AuthGuard] },
  { path: 'transaction-list', component: TransactionListingComponent, canActivate:[AuthGuard] },
  { path: 'person-list', component: PersonsListingComponent, canActivate:[AuthGuard] },
  { path: 'person-details', component: PersonsDetailsComponent, canActivate:[AuthGuard] },
  { path: 'accounts-list', component: AccountsDetailsComponent, canActivate:[AuthGuard] },
  { path: 'transaction', component: TransactionDetailsComponent, canActivate:[AuthGuard] },
  { path: 'account-details', component: AccountsDetailsComponent, canActivate:[AuthGuard] },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
