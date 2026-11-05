import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  if (!isProd) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static assets from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Celebre Catering Server] Listening on http://0.0.0.0:${PORT}`);

    // Non-blocking schema and column migration check on boot
    if (process.env.DATABASE_URL) {
      import('./src/lib/prisma').then(({ getPrismaClient }) => {
        const client = getPrismaClient();
        if (client) {
          import('./src/server/schemaInit').then(({ ensureSchemaReady }) => {
            ensureSchemaReady(client).then(res => {
              console.log('[SchemaInit] Boot schema check completed:', { success: res.success, tables: res.tablesFound.length, columnsEnsured: res.columnsEnsured });
            }).catch(err => {
              console.warn('[SchemaInit] Boot schema check warning:', err?.message || err);
            });
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  });
}

startServer().catch(err => {
  console.error('[Celebre Catering Server] Failed to start:', err);
  process.exit(1);
});
