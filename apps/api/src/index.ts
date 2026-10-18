import { app } from './app.js';
import { checkIsMainModule } from './utils/entrypoint.js';

const PORT = process.env.PORT || 3000;

if (checkIsMainModule(import.meta.url, process.argv[1])) {
  app.listen(PORT, () => {
    console.log(`JanVaani API running on http://localhost:${PORT}`);
  });
}

export { app, checkIsMainModule };
