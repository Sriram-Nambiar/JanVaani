import { app } from './app.js';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[Seva Sindhu Demo API] Server running on http://localhost:${PORT}`);
  console.log(`[Seva Sindhu Demo API] Connected to isolated demo data store.`);
});

export { app };
