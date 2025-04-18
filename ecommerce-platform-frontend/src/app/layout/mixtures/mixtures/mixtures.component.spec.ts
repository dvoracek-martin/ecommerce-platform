import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MixturesComponent } from './mixtures.component';

describe('MixturesComponent', () => {
  let component: MixturesComponent;
  let fixture: ComponentFixture<MixturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MixturesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MixturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
