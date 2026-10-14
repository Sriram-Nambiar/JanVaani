import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
  return path.resolve(fileURLToPath(metaUrl)) === path.resolve(argv1);
}

const PORT = process.env.PORT || 3001;

if (checkIsMainModule(import.meta.url, process.argv[1])) {
  app.listen(PORT, () => {
    console.log(`JanVaani API running on http://localhost:${PORT}`);
  });
}
