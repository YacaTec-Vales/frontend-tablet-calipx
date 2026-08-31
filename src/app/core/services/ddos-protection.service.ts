import { Service, inject, DestroyRef } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Configuración de un bucket de rate-limit. Cada entrada define la
 * cuota máxima para un patrón de URL y cuánto tarda en rellenarse
 * un token.
 */
export interface RateLimitRule {
  /** Patrón glob simple sobre el path de la URL. */
  pattern: string;
  /** Tokens disponibles al inicio (rafaga maxima). */
  capacity: number;
  /** Milisegundos en que se regenera un token. */
  refillMs: number;
  /**
   * Tiempo absoluto máximo que estamos dispuestos a esperar antes
   * de rechazar la petición con 429 local. Por defecto 5s: más
   * allá de eso la UX se rompe y preferimos cortar en cliente.
   */
  maxWaitMs?: number;
}

/**
 * Estado de un bucket. Se persiste solo en memoria: en cuanto se
 * recarga la pestaña un atacante puede resetear la cuota local, que
 * es el comportamiento esperado (el rate-limit real vive en el
 * backend).
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Estados posibles del circuit breaker. Modela el patrón clásico
 * Closed -> Open -> HalfOpen para evitar cascadas de reintentos
 * cuando el origen está caído o saturado.
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Configuración del circuit breaker. Solo el backend decide la
 * politica definitiva; este breaker evita que el cliente multiplique
 * la carga con reintentos agresivos.
 */
export interface CircuitBreakerConfig {
  /** Ventana móvil en ms sobre la que se cuentan los errores. */
  windowMs: number;
  /** Mínimo de requests dentro de la ventana antes de evaluar. */
  minRequests: number;
  /** Ratio de errores (0..1) que dispara la apertura. */
  failureThreshold: number;
  /** Tiempo que el breaker permanece abierto antes de probar. */
  openCooldownMs: number;
}

interface FailureSample {
  ts: number;
  failed: boolean;
}

/**
 * Resultado de un rate-limit check. Si es `allow`, el caller puede
 * continuar. Si es `delay`, debe esperar los ms indicados y volver
 * a llamar. Si es `reject`, el cliente ha agotado la cuota y la
 * petición debe abortarse localmente.
 */
export type RateDecision =
  | { kind: 'allow' }
  | { kind: 'delay'; waitMs: number }
  | { kind: 'reject'; reason: string };

const DEFAULT_RULES: RateLimitRule[] = [
  { pattern: '/auth/login', capacity: 5, refillMs: 30_000 },
  { pattern: '/auth/refresh', capacity: 10, refillMs: 30_000 },
  { pattern: '/auth/forgot-password', capacity: 3, refillMs: 30_000 },
  { pattern: '/health/', capacity: 30, refillMs: 1_000 },
];

const DEFAULT_CIRCUIT: CircuitBreakerConfig = {
  windowMs: 30_000,
  minRequests: 20,
  failureThreshold: 0.5,
  openCooldownMs: 30_000,
};

/**
 * Servicio singleton que provee las primitivas de mitigación DDoS
 * cooperante que consume el interceptor HTTP:
 *
 *  - Rate-limit por bucket de tokens, configurable por patrón.
 *  - Circuit breaker reactivo al ratio de 5xx del backend.
 *  - Huella digital estable del cliente (sin PII) para que el WAF
 *    del backend pueda correlacionar peticiones de un mismo bot.
 *  - Request-id único por petición para correlación en logs.
 *
 * La política final de corte sigue siendo del backend/CDN; este
 * servicio reduce el ruido, evita tormentas de reintentos y le da
 * al origen más información para tomar decisiones.
 */
@Service()
export class DdosProtectionService {
  private readonly rules = new Map<string, RateLimitRule>();
  private readonly buckets = new Map<string, Bucket>();
  private readonly samples: FailureSample[] = [];
  private readonly pendingWaits = new Map<string, Promise<void>>();

  /**
   * ID del setTimeout recursivo en `waitForBudget()` (pollster de rate
   * limit). Se guarda aqui para poder cancelarlo en onDestroy si la app
   * se cierra con un wait pendiente. BUG FIX 2026-08-31: antes era un
   * setTimeout recursivo sin cleanup; podia dejar timers huerfanos
   * en hot-reload (dev) o tests.
   */
  private recursiveTimer?: ReturnType<typeof setTimeout>;

  /**
   * Promesas pendientes para limpiar en destroy (rechazarlas
   * evita callers colgados).
   */
  private readonly pendingResolvers = new Set<() => void>();

  private circuitState: CircuitState = 'closed';
  private circuitOpenedAt = 0;
  private consecutiveHalfOpenSuccesses = 0;

  private fingerprint: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.configure(DEFAULT_RULES, DEFAULT_CIRCUIT);
    // BUG FIX 2026-08-31: cleanup de timers recursivos cuando el
    // servicio (root) se destruye (cierre de pestana, hot-reload, etc.).
    this.destroyRef.onDestroy(() => {
      if (this.recursiveTimer !== undefined) {
        clearTimeout(this.recursiveTimer);
        this.recursiveTimer = undefined;
      }
      // Resolver todas las promesas pendientes para evitar callers colgados.
      for (const resolve of this.pendingResolvers) {
        resolve();
      }
      this.pendingResolvers.clear();
    });
  }

  /**
   * Permite reemplazar las reglas en runtime (ej. tests). Aplica
   * de inmediato a las próximas peticiones.
   */
  configure(
    rules: RateLimitRule[],
    circuit: CircuitBreakerConfig = DEFAULT_CIRCUIT,
  ): void {
    this.rules.clear();
    for (const rule of rules) {
      this.rules.set(rule.pattern, rule);
    }
    this.circuitConfig = circuit;
  }

  private circuitConfig: CircuitBreakerConfig = DEFAULT_CIRCUIT;

  /**
   * Estado actual del breaker. Útil para métricas y para que la UI
   * pueda mostrar un banner de "servicio degradado".
   */
  get state(): { circuit: CircuitState; openedAt: number | null } {
    return {
      circuit: this.circuitState,
      openedAt: this.circuitState === 'open' ? this.circuitOpenedAt : null,
    };
  }

  /**
   * Devuelve la huella digital estable del cliente. Se calcula una
   * sola vez y se cachea para evitar spoofing trivial por rotación
   * de headers.
   */
  getClientFingerprint(): string {
    if (this.fingerprint) return this.fingerprint;

    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const screen = typeof window !== 'undefined' ? window.screen : undefined;

    const parts = [
      nav?.userAgent ?? 'ua-unknown',
      nav?.language ?? 'lang-unknown',
      nav?.languages?.join(',') ?? '',
      nav?.platform ?? 'plat-unknown',
      nav?.hardwareConcurrency?.toString() ?? 'cores-unknown',
      screen ? `${screen.width}x${screen.height}x${screen.colorDepth}` : 'screen-unknown',
      this.timezone(),
    ];

    this.fingerprint = this.hash(parts.join('|'));
    return this.fingerprint;
  }

  /**
   * Genera un UUID v4 sin depender de `crypto.randomUUID` (que
   * falta en algunos navegadores viejos). Suficiente para
   * correlación; no es criptográficamente seguro.
   */
  newRequestId(): string {
    const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
    if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();

    const bytes = new Uint8Array(16);
    if (cryptoObj?.getRandomValues) {
      cryptoObj.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return (
      `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-` +
      `${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-` +
      `${hex.slice(10, 16).join('')}`
    );
  }

  /**
   * Decide si una petición debe salir, esperar o ser abortada por
   * el cliente. Si devuelve `delay`, el caller debe esperar y
   * reintentar (el interceptor hace exactamente eso con un timer).
   */
  checkRateLimit(url: string): RateDecision {
    const rule = this.matchRule(url);
    if (!rule) return { kind: 'allow' };

    const bucket = this.getBucket(rule);
    this.refill(bucket, rule);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { kind: 'allow' };
    }

    const deficit = 1 - bucket.tokens;
    const waitMs = Math.ceil(deficit * rule.refillMs);
    const maxWait = rule.maxWaitMs ?? 5_000;

    if (waitMs > maxWait) {
      return {
        kind: 'reject',
        reason: `rate-limit agotado para ${rule.pattern}`,
      };
    }

    return { kind: 'delay', waitMs };
  }

  /**
   * Espera activa hasta que haya un token disponible, compartiendo
   * la misma promesa entre callers concurrentes para no multiplicar
   * los timers.
   */
  async waitForToken(url: string): Promise<void> {
    const rule = this.matchRule(url);
    if (!rule) return;

    const key = rule.pattern;
    const inflight = this.pendingWaits.get(key);
    if (inflight) return inflight;

    const promise = new Promise<void>((resolve) => {
      // Registrar el resolver para cleanup en destroy.
      this.pendingResolvers.add(resolve);
      const tick = (): void => {
        const decision = this.checkRateLimit(url);
        if (decision.kind === 'allow') {
          this.pendingWaits.delete(key);
          this.pendingResolvers.delete(resolve);
          resolve();
          return;
        }
        const wait = decision.kind === 'delay' ? decision.waitMs : 250;
        // BUG FIX 2026-08-31: guardar ID del timer para cancelarlo en
        // onDestroy si el servicio se destruye con un wait pendiente.
        this.recursiveTimer = setTimeout(tick, Math.min(wait, 1000));
      };
      tick();
    });

    this.pendingWaits.set(key, promise);
    return promise;
  }

  /**
   * True si el circuito permite enviar la petición. En `open`,
   * devuelve false salvo que haya pasado el cooldown (caso
   * `half-open`).
   */
  canSend(): boolean {
    if (this.circuitState === 'closed') return true;

    if (this.circuitState === 'open') {
      const elapsed = Date.now() - this.circuitOpenedAt;
      if (elapsed >= this.circuitConfig.openCooldownMs) {
        this.circuitState = 'half-open';
        this.consecutiveHalfOpenSuccesses = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Registra el resultado de la petición para alimentar el breaker.
   * Los códigos 4xx cuentan como exitosos desde la óptica del
   * backend (la culpa es del cliente, no del origen).
   */
  recordOutcome(status: number, latencyMs: number): void {
    const failed = status === 0 || status >= 500 || status === 429;
    const now = Date.now();

    if (failed) {
      this.onFailure(now, latencyMs);
    } else {
      this.onSuccess(now);
    }

    if (status === 429) {
      this.adaptiveSlowdown(latencyMs);
    }
  }

  /**
   * Atajo para errores donde ni siquiera se obtuvo respuesta.
   */
  recordTransportError(): void {
    this.recordOutcome(0, 0);
  }

  /**
   * Hash FNV-1a 32-bit -> hex. No criptográfico; solo necesitamos
   * una huella estable y barata para fingerprinting.
   */
  private hash(input: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  private timezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'tz-unknown';
    } catch {
      return 'tz-unknown';
    }
  }

  private matchRule(url: string): RateLimitRule | undefined {
    for (const rule of this.rules.values()) {
      if (url.includes(rule.pattern)) return rule;
    }
    return undefined;
  }

  private getBucket(rule: RateLimitRule): Bucket {
    let bucket = this.buckets.get(rule.pattern);
    if (!bucket) {
      bucket = { tokens: rule.capacity, lastRefill: Date.now() };
      this.buckets.set(rule.pattern, bucket);
    }
    return bucket;
  }

  private refill(bucket: Bucket, rule: RateLimitRule): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    if (elapsed <= 0) return;

    const regenerated = elapsed / rule.refillMs;
    bucket.tokens = Math.min(rule.capacity, bucket.tokens + regenerated);
    bucket.lastRefill = now;
  }

  private pruneSamples(now: number): void {
    const cutoff = now - this.circuitConfig.windowMs;
    while (this.samples.length && this.samples[0].ts < cutoff) {
      this.samples.shift();
    }
  }

  private onFailure(now: number, latencyMs: number): void {
    this.samples.push({ ts: now, failed: true });
    this.pruneSamples(now);
    void latencyMs;

    if (this.circuitState === 'half-open') {
      this.trip(now);
      return;
    }

    if (this.samples.length >= this.circuitConfig.minRequests) {
      const fails = this.samples.filter((s) => s.failed).length;
      const ratio = fails / this.samples.length;
      if (ratio >= this.circuitConfig.failureThreshold) {
        this.trip(now);
      }
    }
  }

  private onSuccess(now: number): void {
    this.samples.push({ ts: now, failed: false });
    this.pruneSamples(now);

    if (this.circuitState === 'half-open') {
      this.consecutiveHalfOpenSuccesses += 1;
      if (this.consecutiveHalfOpenSuccesses >= 3) {
        this.circuitState = 'closed';
        this.samples.length = 0;
      }
    }
  }

  private trip(now: number): void {
    if (this.circuitState === 'open') return;
    this.circuitState = 'open';
    this.circuitOpenedAt = now;
    this.consecutiveHalfOpenSuccesses = 0;
  }

  private adaptiveSlowdown(_latencyMs: number): void {
    for (const rule of this.rules.values()) {
      rule.refillMs = Math.min(rule.refillMs * 2, 5 * 60_000);
    }
  }
}
