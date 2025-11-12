import { TestBed } from '@angular/core/testing';

import { RrhhService } from './rrhh.service';

describe('RrhhService', () => {
  let service: RrhhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RrhhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
