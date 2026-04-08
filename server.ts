import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import path from 'path';
import { fileURLToPath } from 'url';

import { appRouter } from './src/server/routers/_app';
import { authMiddleware, handleOAuthLogin, handleOAuthCallback, handleLogout } from './src/server/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Auth routes (Manus OAuth)
  app.get('/auth/login', handleOAuthLogin);
  app.get('/auth/callback', handleOAuthCallback);
  app.get('/auth/logout', handleLogout);

  // Endpoint para verificar sessão atual
  app.get('/auth/me', (req, res) => {
    const userId = (req as any).userId;
    if (userId) {
      res.json({ authenticated: true, userId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // tRPC middleware
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => ({
        req,
        res,
        userId: (req as any).userId,
      }),
    })
  );

  // Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuantIA rodando em http://localhost:${PORT}`);
  });
}

startServer();
