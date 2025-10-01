import { and, eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { integrations } from '../shared/schema';
import { 
    APP_BASE_URL,
    JWT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET
} from './config';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface StateTokenPayload {
  userId: number;
}

const getRedirectUri = (platform: string) => `${APP_BASE_URL}/api/integrations/${platform}/callback`;

// Gera um token temporário para o parâmetro 'state' do OAuth
const createStateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '10m' });
};

// Verifica o token do 'state' e retorna o payload
export const verifyStateToken = (token: string): StateTokenPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as StateTokenPayload;
    if (typeof payload.userId !== 'number') {
      throw new Error('Invalid token payload');
    }
    return payload;
  } catch (error) {
    console.error("State token verification failed:", error);
    throw new Error('Invalid or expired state token.');
  }
};


// --- Lógica para o Google ---
export const getGoogleAuthUrl = (userId: number) => {
  const state = createStateToken(userId);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri('google'),
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/analytics.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: state, // Inclui o token de estado
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const handleGoogleCallback = async (code: string, userId: number) => {
  const tokenParams = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: getRedirectUri('google'),
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.json();
    console.error('Google token exchange failed:', errorBody);
    throw new Error('Failed to exchange Google code for token');
  }

  const tokens: TokenResponse = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await db.insert(integrations).values({
    userId,
    platform: 'google',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  }).onConflictDoUpdate({
    target: [integrations.userId, integrations.platform],
    set: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    },
  });
};


// --- Lógica para o Facebook ---
export const getFacebookAuthUrl = (userId: number) => {
    const state = createStateToken(userId);
    const params = new URLSearchParams({
        client_id: FACEBOOK_CLIENT_ID,
        redirect_uri: getRedirectUri('facebook'),
        scope: 'ads_management,read_insights',
        response_type: 'code',
        state: state, // Inclui o token de estado
    });
    return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
};

export const handleFacebookCallback = async (code: string, userId: number) => {
    const tokenParams = new URLSearchParams({
        code,
        client_id: FACEBOOK_CLIENT_ID,
        client_secret: FACEBOOK_CLIENT_SECRET,
        redirect_uri: getRedirectUri('facebook'),
    });

    const tokenRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${tokenParams.toString()}`);

    if (!tokenRes.ok) {
        const errorBody = await tokenRes.json();
        console.error('Facebook token exchange failed:', errorBody);
        throw new Error('Failed to exchange Facebook code for token');
    }

    const tokens: TokenResponse = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    await db.insert(integrations).values({
        userId,
        platform: 'facebook',
        accessToken: tokens.access_token,
        expiresAt,
    }).onConflictDoUpdate({
        target: [integrations.userId, integrations.platform],
        set: {
            accessToken: tokens.access_token,
            expiresAt,
        },
    });
};

// --- Função genérica para desconectar ---
export const disconnectPlatform = async (platform: string, userId: number) => {
    return await db.delete(integrations).where(and(
        eq(integrations.userId, userId),
        eq(integrations.platform, platform)
    ));
};
