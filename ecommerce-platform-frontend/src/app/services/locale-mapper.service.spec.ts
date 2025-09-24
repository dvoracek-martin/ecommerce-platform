import { TestBed } from '@angular/core/testing';

import { LocaleCodeMapperService } from './locale-mapper.service';

describe('LocaleCodeMapperService', () => {
  let service: LocaleCodeMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocaleCodeMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
