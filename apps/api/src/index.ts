import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'janvaani-api' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'JanVaani API' });
});

export function checkIsMainModule(metaUrl: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    const resolvedArgv = fs.realpathSync(path.resolve(argv1));
    const resolvedMeta = fs.realpathSync(fileURLToPath(metaUrl));
    return resolvedMeta === resolvedArgv;
  } catch {
    return path.resolve(fileURLToPath(metaUrl)) === path.resolve(argv1);
  }
}

const PORT = process.env.PORT || 3001;

if (checkIsMainModule(import.meta.url, process.argv[1])) {
  app.listen(PORT, () => {
    console.log(`JanVaani API running on http://localhost:${PORT}`);
  });
}
