import { DdosProtectionService } from './ddos-protection.service';

describe('DdosProtectionService', () => {
  let service: DdosProtectionService;

  beforeEach(() => {
    service = new DdosProtectionService();
  });

  describe('fingerprint', () => {
    it('es estable entre llamadas', () => {
      const a = service.getClientFingerprint();
      const b = service.getClientFingerprint();
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  describe('request-id', () => {
    it('genera UUIDs distintos', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) ids.add(service.newRequestId());
      expect(ids.size).toBe(100);
    });

    it('tiene formato UUID v4', () => {
      const id = service.newRequestId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('rate-limit', () => {
    it('permite hasta la capacidad del bucket', () => {
      service.configure(
        [{ pattern: '/api/x', capacity: 3, refillMs: 60_000 }],
        { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
      );

      for (let i = 0; i < 3; i++) {
        expect(service.checkRateLimit('https://h/api/x')).toEqual({
          kind: 'allow',
        });
      }
    });

    it('devuelve delay cuando se agota la cuota', () => {
      service.configure(
        [{ pattern: '/api/x', capacity: 1, refillMs: 1_000 }],
        { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
      );

      expect(service.checkRateLimit('https://h/api/x')).toEqual({
        kind: 'allow',
      });
      const decision = service.checkRateLimit('https://h/api/x');
      expect(decision.kind).toBe('delay');
      if (decision.kind === 'delay') {
        expect(decision.waitMs).toBeGreaterThan(0);
        expect(decision.waitMs).toBeLessThanOrEqual(1_000);
      }
    });

    it('no afecta URLs fuera de los patrones', () => {
      service.configure(
        [{ pattern: '/auth/login', capacity: 1, refillMs: 60_000 }],
        { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
      );

      for (let i = 0; i < 50; i++) {
        expect(service.checkRateLimit('https://h/other/path')).toEqual({
          kind: 'allow',
        });
      }
    });

    it('comparte la espera entre callers concurrentes', async () => {
      service.configure(
        [{ pattern: '/api/x', capacity: 1, refillMs: 50 }],
        { windowMs: 30_000, minRequests: 100, failureThreshold: 1, openCooldownMs: 1_000 },
      );

      service.checkRateLimit('https://h/api/x');
      const p1 = service.waitForToken('https://h/api/x');
      const p2 = service.waitForToken('https://h/api/x');
      await Promise.all([p1, p2]);
    });
  });

  describe('circuit breaker', () => {
    function config() {
      return {
        windowMs: 10_000,
        minRequests: 5,
        failureThreshold: 0.5,
        openCooldownMs: 500,
      };
    }

    it('abre cuando se supera el ratio de fallos', () => {
      service.configure([], config());

      for (let i = 0; i < 5; i++) service.recordOutcome(500, 100);
      expect(service.state.circuit).toBe('open');
      expect(service.canSend()).toBe(false);
    });

    it('no abre con menos requests que el mínimo aunque fallen todos', () => {
      service.configure([], { ...config(), minRequests: 10 });

      for (let i = 0; i < 5; i++) service.recordOutcome(500, 100);
      expect(service.state.circuit).toBe('closed');
    });

    it('transiciona a half-open tras el cooldown', () => {
      vi.useFakeTimers();
      try {
        service.configure([], config());
        for (let i = 0; i < 5; i++) service.recordOutcome(500, 100);
        expect(service.state.circuit).toBe('open');

        vi.advanceTimersByTime(600);
        expect(service.canSend()).toBe(true);
        expect(service.state.circuit).toBe('half-open');
      } finally {
        vi.useRealTimers();
      }
    });

    it('cierra tras varios éxitos en half-open', () => {
      vi.useFakeTimers();
      try {
        service.configure([], config());
        for (let i = 0; i < 5; i++) service.recordOutcome(500, 100);
        vi.advanceTimersByTime(600);

        service.canSend();
        service.recordOutcome(200, 50);
        service.recordOutcome(200, 50);
        service.recordOutcome(200, 50);

        expect(service.state.circuit).toBe('closed');
      } finally {
        vi.useRealTimers();
      }
    });

    it('reabre si half-open recibe un fallo', () => {
      vi.useFakeTimers();
      try {
        service.configure([], config());
        for (let i = 0; i < 5; i++) service.recordOutcome(500, 100);
        vi.advanceTimersByTime(600);
        service.canSend();

        service.recordOutcome(500, 100);
        expect(service.state.circuit).toBe('open');
      } finally {
        vi.useRealTimers();
      }
    });

    it('cuenta 4xx como éxito del backend', () => {
      service.configure([], { ...config(), minRequests: 5 });
      for (let i = 0; i < 5; i++) service.recordOutcome(404, 100);
      expect(service.state.circuit).toBe('closed');
    });

    it('cuenta 429 como fallo y abre el circuito', () => {
      service.configure([], { ...config(), minRequests: 1 });
      service.recordOutcome(429, 100);
      expect(service.state.circuit).toBe('open');
    });

    it('transport error abre el circuito', () => {
      service.configure([], { ...config(), minRequests: 5 });
      for (let i = 0; i < 5; i++) service.recordTransportError();
      expect(service.state.circuit).toBe('open');
    });
  });
});
