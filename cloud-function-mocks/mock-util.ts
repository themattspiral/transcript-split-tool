import fs from 'fs';
import { Response } from 'express';
import dotenv from 'dotenv';
import cookie from 'cookie';

import { OauthProvider } from '../src/shared/data';

export const getDotEnvVars = () => {
  const dotEnvVars: { [varKey: string]: string} = {};
  dotenv.config({ processEnv: dotEnvVars, path: ['.env.development','.env.development.local'] });
  return dotEnvVars;
}

const dotEnvVars = getDotEnvVars();
const MOCK_STORE_FILE = './mock-session-store.json';

export interface Session {
  refreshToken: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  usedCount: number;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresInSec: number;
}

export const SESSION_COOKIE_NAME = 'session_id';

export const dateToSec = (date: Date) => Math.floor(date.getTime() / 1000);

export const getNowSec = () => dateToSec(new Date());

export const generateSessionId = (): string => {
  return crypto.randomUUID();
}

export const getSession = (sessionId: string): Session | null => {
  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);
    return store[sessionId] || null;
  } else {
    return null;
  }
};

export const incrementUsedCount = (sessionId: string, lastUsedAt: number): number => {
  let count = -1;

  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);
    if (store[sessionId]) {
      store[sessionId].usedCount++;
      store[sessionId].lastUsedAt = lastUsedAt;
      count = store[sessionId].usedCount;
    }
    fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  }

  return count;
};

export const createSessionOrRotateRefreshToken = (sessionId: string, refreshToken: string, tokenExpiresAt: number | null) => {
  let storeStr = '{}';
  if (fs.existsSync(MOCK_STORE_FILE)) {
    storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
  }
  const store = JSON.parse(storeStr);
  const now = getNowSec();
  
  if (store[sessionId]) {
    console.log('updating existing session in store:', sessionId);
    const session: Session = store[sessionId];
    session.refreshToken = refreshToken;
    session.updatedAt = now;
    session.expiresAt = tokenExpiresAt;
    
    // reset refresh stats
    session.lastUsedAt = null;
    session.usedCount = 0;
  } else {
    console.log('creating new session in store', sessionId);
    const session: Session = {
      refreshToken,
      createdAt: now,
      updatedAt: now,
      expiresAt: tokenExpiresAt,
      lastUsedAt: null,
      usedCount: 0
    };
    store[sessionId] = session;
  };

  fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
};

export const deleteSession = (sessionId?: string | null) => {
  if (!sessionId) {
    console.log('no session id - NOT deleting session');
    return;
  }

  console.log('deleting session from store:', sessionId);

  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);
    delete store[sessionId];
    fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  }
};

export const setSessionCookie = (res: Response, sessionId: string, expiresInSec: number, expiresAtSec: number) => {
  const serializedCookie = cookie.serialize(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.argv?.includes('--ssl'),
    sameSite: 'lax',
    expires: new Date(expiresAtSec * 1000),
    maxAge: expiresInSec,
    path: '/'
  });

  console.log('setting session cookie:', serializedCookie);
  res.set('Set-Cookie', serializedCookie);
};

export const deleteSessionCookie = (res: Response) => {
  const serializedCookie = cookie.serialize(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.argv?.includes('--ssl'),
    sameSite: 'lax',
    expires: new Date(0),
    maxAge: -1,
    path: '/'
  });

  console.log('setting session cookie for delete:', serializedCookie);
  res.set('Set-Cookie', serializedCookie);
};

export const getTokenParams = (oauthProvider: string | null | undefined) => {
  const params: {
    tokenUrl: string | null; clientId: string | null; clientSecret: string | null
  } = {
    tokenUrl: null, clientId: null, clientSecret: null
  };

  // potentially support other providers in the future
  switch (oauthProvider) {
    case OauthProvider.Google:
      params.tokenUrl = dotEnvVars.MOCK_OAUTH_GOOGLE_TOKEN_URI;
      params.clientId = dotEnvVars.TST_OAUTH_GOOGLE_CLIENT_ID;
      params.clientSecret = dotEnvVars.MOCK_OAUTH_GOOGLE_CLIENT_SECRET;
      break;
    default:
      break;
  }

  return params;
};


// admin
export const getAllSessions = (nowSec: number): any[] => {
  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');

    const store = JSON.parse(storeStr);
    
    if (store) {
      return Object.entries(store).map(([sessionId, session]) => {
        const sess = session as Session;
        const expired = sess.expiresAt && sess.expiresAt <= nowSec;
        return {
          expired,
          sessionId,
          session: {
            refreshToken: sess.refreshToken,
            createdAt: `${sess.createdAt} (${ nowSec - sess.createdAt } sec ago)`,
            updatedAt: `${sess.updatedAt} (${ nowSec - sess.updatedAt } sec ago)`,
            grantLegth: sess.expiresAt ? `${ sess.expiresAt - sess.updatedAt } sec` : 'No Expiration',
            expiresAt: `${sess.expiresAt} ${ sess.expiresAt ? `(${ sess.expiresAt - nowSec } sec left)` : 'No Expiration' }`,
            lastUsedAt: `${sess.lastUsedAt} ${ sess.lastUsedAt ? `(${ nowSec - sess.lastUsedAt } sec ago)` : '' }`,
            usedCount: sess.usedCount
          }
        };
      });
    } else {
      return [];
    }
  }
  
  return [];
};

// admin
export const expireSessions = (): number => {
  let expiredCount = 0;

  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);

    if (store) {
      const keys = Object.keys(store);
      const sec = getNowSec();

      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        const session: Session = store[key];
        const expired = session.expiresAt && session.expiresAt <= sec;

        if (expired) {
          console.log('Expired:', key);
          expiredCount++;
          delete store[key];
        }
      }

      fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    }
  }

  return expiredCount;
};
