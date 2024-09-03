import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuficientRightsComponent } from './insuficient-rights.component';

describe('InsuficientRightsComponent', () => {
  let component: InsuficientRightsComponent;
  let fixture: ComponentFixture<InsuficientRightsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InsuficientRightsComponent]
    });
    fixture = TestBed.createComponent(InsuficientRightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
