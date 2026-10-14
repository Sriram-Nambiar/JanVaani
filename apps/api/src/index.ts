import express from 'express';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'janvaani-api' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'JanVaani API' });
});

const PORT = process.env.PORT || 3001;

// Start server when run directly as entrypoint
if (/index\.[cm]?[jt]s$/i.test(process.argv[1] || '')) {
  app.listen(PORT, () => {
    console.log(`JanVaani API running on http://localhost:${PORT}`);
  });
}
