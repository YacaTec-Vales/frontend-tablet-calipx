import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { DdosProtectionService } from '../services/ddos-protection.service';
import {
  CLIENT_TIMESTAMP_HEADER,
  FINGERPRINT_HEADER,
  REQUEST_ID_HEADER,
  ddosProtectionInterceptor,
} from './ddos-protection.interceptor';

describe('ddosProtectionInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let service: DdosProtectionService;
  const originalEnabled = environment.ddosProtection;

  beforeEach(() => {
    environment.ddosProtection = true;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([ddosProtectionInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DdosProtectionService);
    service.configure(
      [],
      { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
    );
  });

  afterEach(() => {
    controller.verify();
    environment.ddosProtection = originalEnabled;
  });

  it('inyecta fingerprint, request-id y timestamp en cada request', () => {
    http.get('/api/v1/clientes').subscribe();

    const req = controller.expectOne('/api/v1/clientes');
    expect(req.request.headers.get(FINGERPRINT_HEADER)).toMatch(/^[0-9a-f]{8}$/);
    expect(req.request.headers.get(REQUEST_ID_HEADER)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(req.request.headers.get(CLIENT_TIMESTAMP_HEADER)).toBeDefined();
    req.flush([]);
  });

  it('es bypass cuando environment.ddosProtection es false', () => {
    environment.ddosProtection = false;

    http.get('/api/v1/clientes').subscribe();

    const req = controller.expectOne('/api/v1/clientes');
    expect(req.request.headers.has(FINGERPRINT_HEADER)).toBe(false);
    expect(req.request.headers.has(REQUEST_ID_HEADER)).toBe(false);
    req.flush([]);
  });

  it('emite 503 local cuando el circuit breaker está abierto', () => {
    service.configure(
      [{ pattern: '/api/x', capacity: 5, refillMs: 60_000 }],
      { windowMs: 10_000, minRequests: 1, failureThreshold: 0.5, openCooldownMs: 60_000 },
    );
    for (let i = 0; i < 5; i++) service.recordOutcome(500, 10);
    expect(service.state.circuit).toBe('open');

    let receivedError: HttpErrorResponse | undefined;
    http.get('/api/v1/whatever').subscribe({
      next: () => {
        throw new Error('no debería llegar al servidor');
      },
      error: (err) => (receivedError = err),
    });

    controller.expectNone(() => true);
    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect(receivedError?.status).toBe(503);
    expect((receivedError?.error as { code: string }).code).toBe('CIRCUIT_OPEN');
  });

  it('rechaza con 429 local cuando se excede el rate-limit', () => {
    service.configure(
      [{ pattern: '/api/x', capacity: 1, refillMs: 60_000, maxWaitMs: 10 }],
      { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
    );

    http.get('/api/x').subscribe();
    const first = controller.expectOne('/api/x');
    first.flush({});

    let receivedError: HttpErrorResponse | undefined;
    http.get('/api/x').subscribe({
      next: () => {
        throw new Error('no debería llegar');
      },
      error: (err) => (receivedError = err),
    });

    expect(receivedError?.status).toBe(429);
    expect((receivedError?.error as { code: string }).code).toBe(
      'CLIENT_RATE_LIMIT',
    );
  });

  it('alimenta el circuit breaker con 5xx', () => {
    service.configure(
      [],
      { windowMs: 10_000, minRequests: 5, failureThreshold: 1, openCooldownMs: 60_000 },
    );

    for (let i = 0; i < 5; i++) {
      http.get('/api/v1/whatever').subscribe({
        error: () => {},
      });
      const req = controller.expectOne('/api/v1/whatever');
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });
    }

    expect(service.state.circuit).toBe('open');
  });

  it('alimenta el circuit breaker con errores de transporte', () => {
    service.configure(
      [],
      { windowMs: 10_000, minRequests: 5, failureThreshold: 1, openCooldownMs: 60_000 },
    );

    for (let i = 0; i < 5; i++) {
      http.get('/api/v1/whatever').subscribe({
        error: () => {},
      });
      const req = controller.expectOne('/api/v1/whatever');
      req.error(new ProgressEvent('error'));
    }

    expect(service.state.circuit).toBe('open');
  });
});
