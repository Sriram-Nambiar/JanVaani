import express from 'express';
import { validateBody, validateQuery } from './middleware/validate.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { citizenQuestionSchema } from './schemas/citizen-question.js';
import { serviceLookupSchema } from './schemas/service-lookup.js';
import { whatsappRouter } from './routes/whatsapp.js';
import { grievanceRouter } from './routes/grievance.js';
import { receiptRouter } from './routes/receipt.js';
import { kioskRouter } from './routes/kiosk.js';
import { verificationRouter } from './routes/verification.js';
import { meterRouter } from './routes/meter.js';
import { yuvaNidhiRouter } from './routes/yuva-nidhi.js';
import { shaktiRouter } from './routes/shakti.js';
import { annaBhagyaRouter } from './routes/annabhagya.js';
import { bhoomiRouter } from './routes/bhoomi.js';
import { audioCacheRouter } from './routes/audio-cache.js';
import { indicRouter } from './routes/indic.js';
import { civicAuditLoggerMiddleware, auditRouter } from './middleware/audit-logger.js';
import { rateLimiterMiddleware, rateLimitRouter } from './middleware/rate-limiter.js';
import { correlationIdMiddleware, tracingRouter } from './middleware/correlation-id.js';
import { circuitBreakerRouter } from './services/circuit-breaker.js';
import { payloadGuardMiddleware, payloadGuardRouter } from './middleware/payload-guard.js';
import { drainMiddleware, drainRouter } from './services/drain-manager.js';
import { etagCacheMiddleware, etagRouter } from './middleware/etag-cache.js';
import { requestSanitizerMiddleware, sanitizerRouter } from './middleware/request-sanitizer.js';
import { jobQueueRouter } from './services/job-queue.js';
import { readinessRouter } from './routes/readiness.js';
import { distributedLockRouter } from './services/distributed-lock.js';
import { compressionNegotiatorMiddleware, compressionRouter } from './middleware/compression-negotiator.js';
import { maintenanceGuardMiddleware, maintenanceRouter } from './middleware/maintenance-guard.js';
import { baileysRouter } from './services/baileys-gateway.js';
import { dashboardRouter } from './routes/dashboard.js';

export function createApp() {
  const app = express();

  // Basic CORS support for web frontend
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(drainMiddleware);
  app.use(maintenanceGuardMiddleware);
  app.use(payloadGuardMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(requestSanitizerMiddleware);
  app.use(correlationIdMiddleware);
  app.use(civicAuditLoggerMiddleware);
  app.use(rateLimiterMiddleware);
  app.use(etagCacheMiddleware);
  app.use(compressionNegotiatorMiddleware);

  const handleHealth = (_req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: 'ok',
      service: 'janvaani-api',
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/api/health', handleHealth);
  app.get('/health', handleHealth);

  app.get('/', (_req, res) => {
    res.json({ message: 'JanVaani API' });
  });

  // Future civic-question contract route
  app.post('/api/questions', validateBody(citizenQuestionSchema), (req, res) => {
    res.status(200).json({
      status: 'received',
      data: req.body,
    });
  });

  // Future government-service lookup contract route
  app.get('/api/services', validateQuery(serviceLookupSchema), (req, res) => {
    res.status(200).json({
      status: 'ok',
      data: {
        query: res.locals.validatedQuery,
        results: [],
      },
    });
  });

  // JanVaani WhatsApp Civic Copilot route (Dhvani-Form, Kagada-Check, Audio Status Bell)
  app.use('/api/baileys', baileysRouter);
  app.use('/api/maintenance', maintenanceRouter);
  app.use('/api/compression', compressionRouter);
  app.use('/api/locks', distributedLockRouter);
  app.use('/api/readiness', readinessRouter);
  app.use('/api/jobs', jobQueueRouter);
  app.use('/api/security/sanitizer', sanitizerRouter);
  app.use('/api/cache/etag', etagRouter);
  app.use('/api/drain', drainRouter);
  app.use('/api/payload-guard', payloadGuardRouter);
  app.use('/api/circuit-breaker', circuitBreakerRouter);
  app.use('/api/tracing', tracingRouter);
  app.use('/api/rate-limit', rateLimitRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/indic', indicRouter);
  app.use('/api/audio/cache', audioCacheRouter);
  app.use('/api/bhoomi', bhoomiRouter);
  app.use('/api/annabhagya', annaBhagyaRouter);
  app.use('/api/shakti', shaktiRouter);
  app.use('/api/yuva-nidhi', yuvaNidhiRouter);
  app.use('/api/meter', meterRouter);
  app.use('/api/verify', verificationRouter);
  app.use('/api/kiosk', kioskRouter);
  app.use('/api/whatsapp/receipt', receiptRouter);
  app.use('/api/whatsapp/grievance', grievanceRouter);
  app.use('/api/whatsapp', whatsappRouter);
  app.use('/api/dashboard', dashboardRouter);

  // 404 for unhandled routes
  app.use(notFoundHandler);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
