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

  app.use(express.json({ limit: '10mb' }));

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
  app.use('/api/verify', verificationRouter);
  app.use('/api/kiosk', kioskRouter);
  app.use('/api/whatsapp/receipt', receiptRouter);
  app.use('/api/whatsapp/grievance', grievanceRouter);
  app.use('/api/whatsapp', whatsappRouter);

  // 404 for unhandled routes
  app.use(notFoundHandler);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
