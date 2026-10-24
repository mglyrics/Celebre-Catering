import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from '../src/server/routes';

const app = express();

app.use(cors());
app.use(express.json());

// Path normalizer to handle all Vercel rewrite permutations seamlessly
app.use((req: Request, res: Response, next: NextFunction) => {
  // 1. If query contains rewritten path
  const queryPath = typeof req.query.__path === 'string' ? req.query.__path : null;
  // 2. If Vercel forwarded URI header is present
  const forwardedUri = (req.headers['x-forwarded-uri'] as string) || (req.headers['x-matched-path'] as string);

  if (queryPath) {
    req.url = `/${queryPath.replace(/^\//, '')}`;
  } else if (forwardedUri && forwardedUri.startsWith('/api')) {
    req.url = forwardedUri.replace(/^\/api/, '') || '/';
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }

  next();
});

// Mount the apiRouter
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback 404 handler for unrecognized API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `المسار المطلوب غير موجود: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Global Error Handler guaranteeing standardized JSON responses
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Server Error]:', err);
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    success: false,
    error: err.message || 'حدث خطأ في الخادم أثناء معالجة الطلب',
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
