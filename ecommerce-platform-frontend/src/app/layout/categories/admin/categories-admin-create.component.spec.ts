import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesAdminCreateComponent } from './categories-admin-create.component';

describe('CategoriesAdminComponent', () => {
  let component: CategoriesAdminCreateComponent;
  let fixture: ComponentFixture<CategoriesAdminCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoriesAdminCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriesAdminCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
