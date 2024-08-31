import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionListingComponent } from './transaction-listing.component';

describe('TransactionListingComponent', () => {
  let component: TransactionListingComponent;
  let fixture: ComponentFixture<TransactionListingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionListingComponent]
    });
    fixture = TestBed.createComponent(TransactionListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
