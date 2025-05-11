import { TestBed } from '@angular/core/testing';

import { MixtureService } from './mixture.service';

describe('MixtureService', () => {
  let service: MixtureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MixtureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
