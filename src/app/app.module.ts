import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { AccountsListingComponent } from './accounts-listing/accounts-listing.component';
import { AccountsDetailsComponent } from './accounts-details/accounts-details.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LoginComponent } from './login/login.component';
import { PersonsListingComponent } from './persons-listing/persons-listing.component';
import { PersonsDetailsComponent } from './persons-details/persons-details.component';
import { TransactionListingComponent } from './transaction-listing/transaction-listing.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';

import { InputTextModule} from 'primeng/inputtext';
import { TableModule} from 'primeng/table';
import { PasswordModule} from 'primeng/password';
import { AnimateModule } from 'primeng/animate';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { MessagesModule } from 'primeng/messages';
import { ChartModule } from 'primeng/chart';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { DropdownModule } from 'primeng/dropdown';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from 'src/environments/environment';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthenticationInterceptor } from './services/interceptor';



@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    AccountsListingComponent,
    AccountsDetailsComponent,
    ContactsComponent,
    LoginComponent,
    PersonsListingComponent,
    PersonsDetailsComponent,
    TransactionListingComponent,
    TransactionDetailsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    TableModule,
    InputTextModule,
    RouterModule,
    ButtonModule,
    FormsModule,
    ReactiveFormsModule,
    PasswordModule,
    AnimateModule,
    ConfirmDialogModule,
    BrowserAnimationsModule,
    CardModule,
    ToastModule,
    MenubarModule,
    MessagesModule,
    ChartModule,
    CheckboxModule,
    CalendarModule,
    InputTextareaModule,
    DynamicDialogModule,
    DropdownModule
  ],
  providers: [
    { provide:HTTP_INTERCEPTORS,
    useClass:AuthenticationInterceptor,
    multi: true
    },
    { provide: 'ENVIRONMENT', useValue: environment },
    MessageService,ConfirmationService,DialogService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
