import { Request, Response, Router } from 'express';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
  maxFailuresTracked: number;
}

export interface ServiceFailure {
  timestamp: number;
  errorMessage: string;
}

const MAX_FAILURE_HISTORY = 50;
const ALLOWED_SERVICES = new Set(['sarvam-ai', 'seva-sindhu', 'digilocker', 'bhoomi', 'bescom', 'test-upstream']);

// In-memory circuit state storage with bounded retention
const failureHistory = new Map<string, ServiceFailure[]>();
const circuitStates = new Map<string, CircuitState>();
const lastStateChange = new Map<string, number>();

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 30000, // 30 seconds
  maxFailuresTracked: MAX_FAILURE_HISTORY,
};

export class CircuitBreakerEngine {
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  public isValidService(serviceName: string): boolean {
    return ALLOWED_SERVICES.has(serviceName) || /^[a-z0-9\-]{3,32}$/.test(serviceName);
  }

  public getState(serviceName: string): CircuitState {
    const currentState = circuitStates.get(serviceName) || 'CLOSED';
    if (currentState === 'OPEN') {
      const lastChange = lastStateChange.get(serviceName) || 0;
      if (Date.now() - lastChange >= this.config.cooldownMs) {
        circuitStates.set(serviceName, 'HALF_OPEN');
        return 'HALF_OPEN';
      }
    }
    return currentState;
  }

  public recordSuccess(serviceName: string): void {
    if (!this.isValidService(serviceName)) return;
    circuitStates.set(serviceName, 'CLOSED');
    failureHistory.set(serviceName, []);
    lastStateChange.set(serviceName, Date.now());
  }

  public recordFailure(serviceName: string, error: string): void {
    if (!this.isValidService(serviceName)) return;

    let failures = failureHistory.get(serviceName) || [];
    failures.push({
      timestamp: Date.now(),
      errorMessage: typeof error === 'string' ? error.slice(0, 200) : 'Upstream error',
    });

    // Enforce bounded failure history
    if (failures.length > this.config.maxFailuresTracked) {
      failures = failures.slice(-this.config.maxFailuresTracked);
    }
    failureHistory.set(serviceName, failures);

    if (failures.length >= this.config.failureThreshold) {
      circuitStates.set(serviceName, 'OPEN');
      lastStateChange.set(serviceName, Date.now());
    }
  }

  public getStats() {
    const stats: Record<string, { state: CircuitState; failureCount: number }> = {};
    for (const [service, state] of circuitStates.entries()) {
      stats[service] = {
        state,
        failureCount: failureHistory.get(service)?.length || 0,
      };
    }
    return stats;
  }

  public resetAll(): void {
    circuitStates.clear();
    failureHistory.clear();
    lastStateChange.clear();
  }
}

export const circuitBreaker = new CircuitBreakerEngine();

export const circuitBreakerRouter = Router();

/**
 * GET /api/circuit-breaker/status
 * Returns current status of all upstream circuit breakers
 */
circuitBreakerRouter.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    data: circuitBreaker.getStats(),
  });
});

/**
 * POST /api/circuit-breaker/trigger-mock
 * Simulate upstream failure for testing
 */
circuitBreakerRouter.post('/trigger-mock', (req: Request, res: Response) => {
  const service = req.body?.service || 'sarvam-ai';

  if (!circuitBreaker.isValidService(service)) {
    res.status(400).json({
      error: {
        code: 'INVALID_SERVICE_NAME',
        message: 'Service identifier contains invalid characters or exceeds allowed length',
      },
    });
    return;
  }

  circuitBreaker.recordFailure(service, 'Simulated upstream connection failure');
  const state = circuitBreaker.getState(service);

  if (state === 'OPEN') {
    res.status(503).json({
      error: {
        code: 'CIRCUIT_OPEN',
        message: `Upstream service ${service} circuit is OPEN. Requests are temporarily suspended.`,
      },
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    service,
    state,
  });
});

/**
 * POST /api/circuit-breaker/reset
 * Admin endpoint to reset tripped circuit breakers (Authenticated via environment key)
 */
circuitBreakerRouter.post('/reset', (req: Request, res: Response) => {
  const secret = process.env.CIRCUIT_BREAKER_ADMIN_KEY;
  const token = req.headers['x-admin-key'];

  if (!secret || token !== secret) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid x-admin-key header is required to reset circuit breakers.',
      },
    });
    return;
  }

  circuitBreaker.resetAll();
  res.status(200).json({
    status: 'ok',
    message: 'All upstream circuit breakers reset to CLOSED state',
  });
});
