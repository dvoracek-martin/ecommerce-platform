import { TestBed } from '@angular/core/testing';

import { LocaleMapperService } from './locale-mapper.service';

describe('LocaleMapperService', () => {
  let service: LocaleMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocaleMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
