import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';
import { app } from './app.js';
import { checkIsMainModule } from './utils/entrypoint.js';
import { errorHandler, AppError } from './middleware/error-handler.js';
import { validateQuery } from './middleware/validate.js';

describe('JanVaani API Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Health and Info Endpoints', () => {
    it('GET /api/health returns 200, application/json, and expected structure', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('application/json'));
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.service, 'janvaani-api');
      assert.ok(typeof data.timestamp === 'string');
    });

    it('GET /health provides backward-compatible health check', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.service, 'janvaani-api');
    });

    it('GET / returns root API message', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.deepStrictEqual(data, { message: 'JanVaani API' });
    });
  });

  describe('Centralized Error Handling', () => {
    it('GET /api/unknown-route returns 404 with structured NOT_FOUND error', async () => {
      const res = await fetch(`${baseUrl}/api/unknown-route`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'NOT_FOUND');
      assert.ok(data.error?.message?.includes('Route not found'));
    });

    it('POST /api/questions with malformed JSON body returns 400 MALFORMED_JSON', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"question": "invalid json...',
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'MALFORMED_JSON');
      assert.strictEqual(data.error?.message, 'The request body contains invalid JSON.');
      assert.strictEqual(data.error?.stack, undefined);
    });

    it('errorHandler does not expose stack traces by default', () => {
      let responseData: any = null;
      let responseStatus = 0;
      const mockRes: any = {
        status(code: number) {
          responseStatus = code;
          return this;
        },
        json(data: any) {
          responseData = data;
          return this;
        },
      };

      const err = new Error('Sensitive database connection failure');
      errorHandler(err, {} as any, mockRes, (() => {}) as any);

      assert.strictEqual(responseStatus, 500);
      assert.strictEqual(responseData.error?.code, 'INTERNAL_SERVER_ERROR');
      assert.strictEqual(responseData.error?.stack, undefined);
    });

    it('errorHandler catches body-parser entity.parse.failed SyntaxError as MALFORMED_JSON', () => {
      let responseData: any = null;
      let responseStatus = 0;
      const mockRes: any = {
        status(code: number) {
          responseStatus = code;
          return this;
        },
        json(data: any) {
          responseData = data;
          return this;
        },
      };

      const bodyParserErr = Object.assign(new SyntaxError('Unexpected token in JSON'), {
        status: 400,
        type: 'entity.parse.failed',
      });
      errorHandler(bodyParserErr, {} as any, mockRes, (() => {}) as any);

      assert.strictEqual(responseStatus, 400);
      assert.strictEqual(responseData.error?.code, 'MALFORMED_JSON');
    });

    it('errorHandler does not misclassify application SyntaxErrors as MALFORMED_JSON', () => {
      let responseData: any = null;
      let responseStatus = 0;
      const mockRes: any = {
        status(code: number) {
          responseStatus = code;
          return this;
        },
        json(data: any) {
          responseData = data;
          return this;
        },
      };

      const appSyntaxErr = Object.assign(new SyntaxError('Invalid SQL or query syntax'), {
        status: 400,
      });
      errorHandler(appSyntaxErr, {} as any, mockRes, (() => {}) as any);

      assert.strictEqual(responseStatus, 500);
      assert.strictEqual(responseData.error?.code, 'INTERNAL_SERVER_ERROR');
    });

    it('errorHandler suppresses stack traces in production even if DEBUG is set', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalDebug = process.env.DEBUG;
      process.env.NODE_ENV = 'production';
      process.env.DEBUG = 'true';

      try {
        let responseData: any = null;
        let responseStatus = 0;
        const mockRes: any = {
          status(code: number) {
            responseStatus = code;
            return this;
          },
          json(data: any) {
            responseData = data;
            return this;
          },
        };

        const err = new Error('Database connection failed');
        errorHandler(err, {} as any, mockRes, (() => {}) as any);

        assert.strictEqual(responseStatus, 500);
        assert.strictEqual(responseData.error?.code, 'INTERNAL_SERVER_ERROR');
        assert.strictEqual(responseData.error?.message, 'An unexpected error occurred.');
        assert.strictEqual(responseData.error?.stack, undefined);
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.DEBUG = originalDebug;
      }
    });
  });

  describe('Citizen Question Validation (POST /api/questions)', () => {
    it('accepts valid English citizen question payload', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'How do I apply for a ration card in Karnataka?',
          language: 'en',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'received');
      assert.strictEqual(data.data.language, 'en');
      assert.strictEqual(data.data.question, 'How do I apply for a ration card in Karnataka?');
    });

    it('accepts valid Kannada citizen question payload', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'ಪಡಿತರ ಚೀಟಿಗಾಗಿ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು?',
          language: 'kn',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'received');
      assert.strictEqual(data.data.language, 'kn');
    });

    it('accepts valid question when language is omitted', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Where can I access Seva Sindhu services?',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'received');
      assert.strictEqual(data.data.language, undefined);
    });

    it('rejects missing question field with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'en',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(data.error?.details));
      const fieldError = data.error.details.find((d: any) => d.field === 'question');
      assert.ok(fieldError, 'Expected validation error detail for question');
    });

    it('rejects empty question string with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: '    ',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'question');
      assert.ok(fieldError);
      assert.strictEqual(fieldError.message, 'Question cannot be empty.');
    });

    it('rejects unsupported language code with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Valid question',
          language: 'fr',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'language');
      assert.ok(fieldError);
    });

    it('rejects question exceeding maximum length limit (1000 chars)', async () => {
      const longQuestion = 'a'.repeat(1001);
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: longQuestion,
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'question');
      assert.ok(fieldError);
      assert.strictEqual(fieldError.message, 'Question cannot exceed 1000 characters.');
    });

    it('rejects non-object body payload (e.g. array)', async () => {
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(['not', 'an', 'object']),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
    });
  });

  describe('Service Lookup Validation (GET /api/services)', () => {
    it('accepts valid query parameters and applies pagination defaults', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=ration`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.data.query.query, 'ration');
      assert.strictEqual(data.data.query.page, 1);
      assert.strictEqual(data.data.query.limit, 10);
    });

    it('accepts comprehensive query with department, language, page, and limit', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=revenue&department=Revenue&language=kn&page=2&limit=25`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.data.query.department, 'Revenue');
      assert.strictEqual(data.data.query.language, 'kn');
      assert.strictEqual(data.data.query.page, 2);
      assert.strictEqual(data.data.query.limit, 25);
    });

    it('rejects missing search query with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/services?page=1`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'query');
      assert.ok(fieldError);
    });

    it('rejects empty search query with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=%20%20`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'query');
      assert.ok(fieldError);
      assert.strictEqual(fieldError.message, 'Search query cannot be empty.');
    });

    it('rejects invalid page number (< 1)', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=ration&page=0`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'page');
      assert.ok(fieldError);
    });

    it('rejects pagination limit exceeding maximum (100)', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=ration&limit=500`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'limit');
      assert.ok(fieldError);
      assert.strictEqual(fieldError.message, 'Limit cannot exceed 100.');
    });

    it('rejects non-numeric pagination values', async () => {
      const res = await fetch(`${baseUrl}/api/services?query=ration&page=abc`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'VALIDATION_ERROR');
      const fieldError = data.error?.details?.find((d: any) => d.field === 'page');
      assert.ok(fieldError);
    });

    it('safely assigns req.query even if req has a prototype getter', async () => {
      const proto = {};
      Object.defineProperty(proto, 'query', {
        get() {
          return { query: 'raw_input' };
        },
        configurable: true,
      });
      const req: any = Object.create(proto);
      let nextCalled = false;
      const res: any = {};
      const schema = z.object({
        query: z.string().transform((val) => `validated_${val}`),
      });
      await validateQuery(schema)(req, res, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.query.query, 'validated_raw_input');
      assert.strictEqual(Object.prototype.hasOwnProperty.call(req, 'query'), true);
    });
  });

  describe('Entrypoint guard (checkIsMainModule)', () => {
    const currentMetaUrl = import.meta.url;

    it('returns true when argv[1] matches canonical module path', () => {
      const filePath = fs.realpathSync(fileURLToPath(currentMetaUrl));
      assert.strictEqual(checkIsMainModule(currentMetaUrl, filePath), true);
    });

    it('returns false when argv[1] is a different file named index.ts', () => {
      assert.strictEqual(checkIsMainModule(currentMetaUrl, path.resolve('/different/path/index.ts')), false);
    });

    it('returns false when argv[1] is undefined', () => {
      assert.strictEqual(checkIsMainModule(currentMetaUrl, undefined), false);
    });
  });
});
