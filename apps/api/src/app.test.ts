import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { app, checkIsMainModule } from './index.js';

describe('API routes', () => {
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

  it('GET /health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, { status: 'ok', service: 'janvaani-api' });
  });

  it('GET / returns api message', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, { message: 'JanVaani API' });
  });
});

describe('Entrypoint guard (checkIsMainModule)', () => {
  const currentMetaUrl = import.meta.url;

  it('returns true when argv[1] matches module path exactly', () => {
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
