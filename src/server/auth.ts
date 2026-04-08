import { SignJWT, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'changeme-use-a-long-random-secret-in-production'
);

const MANUS_OAUTH_URL = process.env.MANUS_OAUTH_URL || '';
const MANUS_CLIENT_ID = process.env.MANUS_CLIENT_ID || '';
const MANUS_CLIENT_SECRET = process.env.MANUS_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  if (token) {
    const userId = await verifySession(token);
    if (userId) {
      (req as any).userId = userId;
    }
  }
  next();
}

// Manus OAuth: redireciona o usuário para a tela de login do Manus
export function handleOAuthLogin(req: Request, res: Response) {
  const redirectUri = `${APP_URL}/auth/callback`;
  const params = new URLSearchParams({
    client_id: MANUS_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  });
  res.redirect(`${MANUS_OAUTH_URL}/authorize?${params}`);
}

// Manus OAuth: troca o código pelo token e cria sessão JWT
export async function handleOAuthCallback(req: Request, res: Response) {
  const { code } = req.query as { code: string };
  if (!code) {
    return res.status(400).json({ error: 'Código OAuth ausente.' });
  }

  try {
    const redirectUri = `${APP_URL}/auth/callback`;
    const tokenRes = await fetch(`${MANUS_OAUTH_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: MANUS_CLIENT_ID,
        client_secret: MANUS_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new Error(tokenData.error || 'Falha ao obter token.');
    }

    // Busca informações do usuário
    const userRes = await fetch(`${MANUS_OAUTH_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json() as { sub?: string };
    const userId = user.sub || tokenData.access_token;

    const session = await signSession(userId);
    res.cookie('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    res.redirect('/');
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'Falha na autenticação.' });
  }
}

export function handleLogout(req: Request, res: Response) {
  res.clearCookie('session');
  res.redirect('/');
}
