import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { servicesRouter } from './routes/services.js';
import { otpRouter } from './routes/otp.js';
import { applicationsRouter } from './routes/applications.js';

export const app = express();

// Configurable CORS origins
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
];

if (process.env.CORS_ORIGIN) {
  const customOrigins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
  allowedOrigins.push(...customOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Top-level Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'seva-sindhu-demo-api',
    port: process.env.PORT || 3002,
    timestamp: new Date().toISOString(),
    isDemoPortal: true,
  });
});

// Mount Routes
app.use('/api/services', servicesRouter);
app.use('/api/demo/otp', otpRouter);
app.use('/api/applications', applicationsRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Seva API Error]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred in the Seva portal API.',
  });
});
