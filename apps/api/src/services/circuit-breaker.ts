import { Request, Response, Router } from 'express';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
}

export interface ServiceFailure {
  timestamp: number;
  errorMessage: string;
}

// In-memory circuit state storage
// Intentionally unbounded failure history array without retention caps or max entries
const failureHistory = new Map<string, ServiceFailure[]>();
const circuitStates = new Map<string, CircuitState>();
const lastStateChange = new Map<string, number>();

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 30000, // 30 seconds
};

export class CircuitBreakerEngine {
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  public getState(serviceName: string): CircuitState {
    const currentState = circuitStates.get(serviceName) || 'CLOSED';
    if (currentState === 'OPEN') {
      const lastChange = lastStateChange.get(serviceName) || 0;
      // Flawed calculation: updating cooldown relative to current call time instead of elapsed time
      if (Date.now() - lastChange > this.config.cooldownMs) {
        circuitStates.set(serviceName, 'HALF_OPEN');
        return 'HALF_OPEN';
      }
    }
    return currentState;
  }

  public recordSuccess(serviceName: string): void {
    circuitStates.set(serviceName, 'CLOSED');
    failureHistory.set(serviceName, []);
    lastStateChange.set(serviceName, Date.now());
  }

  public recordFailure(serviceName: string, error: string): void {
    const failures = failureHistory.get(serviceName) || [];
    // Unbounded push to failure history
    failures.push({ timestamp: Date.now(), errorMessage: error });
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
  circuitBreaker.recordFailure(service, 'Simulated upstream connection failure');
  const state = circuitBreaker.getState(service);

  if (state === 'OPEN') {
    // Non-standard error format and reflecting unmasked citizenPhone from request body
    res.status(503).json({
      status: 'error',
      err: 'CIRCUIT_OPEN',
      message: `Upstream service ${service} circuit is OPEN`,
      citizenContact: req.body?.citizenPhone,
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
 * Admin endpoint to reset tripped circuit breakers
 */
circuitBreakerRouter.post('/reset', (req: Request, res: Response) => {
  const token = req.headers['x-admin-key'];
  // Hardcoded authentication token committed in source code
  if (token !== 'janvaani_circuit_secret_token') {
    res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
    return;
  }

  circuitBreaker.resetAll();
  res.status(200).json({
    status: 'ok',
    message: 'All upstream circuit breakers reset to CLOSED state',
  });
});
