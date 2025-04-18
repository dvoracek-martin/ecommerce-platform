import { TestBed } from '@angular/core/testing';

import { CategoriesAdminService } from './categories-admin.service';

describe('CategoriesAdminService', () => {
  let service: CategoriesAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoriesAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
