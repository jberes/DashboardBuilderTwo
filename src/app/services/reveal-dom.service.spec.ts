import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RevealDomService } from './reveal-dom.service';

describe('RevealDomService', () => {
  let service: RevealDomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(RevealDomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
