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

const PORT = process.env.PORT || 3001;

const isMainModule = Boolean(
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])
);

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`JanVaani API running on http://localhost:${PORT}`);
  });
}
