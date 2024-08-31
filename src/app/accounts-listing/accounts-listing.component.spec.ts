import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountsListingComponent } from './accounts-listing.component';

describe('AccountsListingComponent', () => {
  let component: AccountsListingComponent;
  let fixture: ComponentFixture<AccountsListingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountsListingComponent]
    });
    fixture = TestBed.createComponent(AccountsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
