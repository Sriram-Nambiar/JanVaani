import express from 'express';
import { validateBody, validateQuery } from './middleware/validate.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { citizenQuestionSchema } from './schemas/citizen-question.js';
import { serviceLookupSchema } from './schemas/service-lookup.js';

export function createApp() {
  const app = express();

  app.use(express.json());

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

  // 404 for unhandled routes
  app.use(notFoundHandler);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
