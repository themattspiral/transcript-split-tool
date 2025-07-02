import fs from 'fs';
import { Response } from 'express';
import dotenv from 'dotenv';
import cookie from 'cookie';

import { OauthProvider, Session } from '../cloud-functions/cloud-function-data';

export const getDotEnvVars = () => {
  const dotEnvVars: { [varKey: string]: string} = {};
  dotenv.config({ processEnv: dotEnvVars, path: ['.env.development','.env.development.local'] });
  return dotEnvVars;
}

const dotEnvVars = getDotEnvVars();
const MOCK_STORE_FILE = './mock-session-store.json';
const MIN_SESSION_AGE_SEC = 60 * 60 * 24;  // 1 day
const MAX_SESSION_AGE_SEC = 60 * 60 * 24 * 90;  // 90 days

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

export const createSession = (provider: OauthProvider, refreshToken: string, tokenExpiresAt: number | null, rememberMe: boolean): string => {
  let storeStr = '{}';
  if (fs.existsSync(MOCK_STORE_FILE)) {
    storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
  }
  const store = JSON.parse(storeStr);
  const now = getNowSec();

  const sessionId = generateSessionId();
  console.log('creating new session in store', sessionId);

  let sessionExpiresAt = now + MIN_SESSION_AGE_SEC;
  if (rememberMe) {
    sessionExpiresAt = tokenExpiresAt ? Math.min(now + MAX_SESSION_AGE_SEC, tokenExpiresAt) : now + MAX_SESSION_AGE_SEC;
  }
  
  const session: Session = {
    provider,
    refreshToken,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    usedCount: 0,
    tokenExpiresAt: tokenExpiresAt,
    rememberMe,
    sessionExpiresAt
  };
  store[sessionId] = session;

  fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');

  return sessionId;
};

export const sessionRefreshWithTokenRotation = (sessionId: string, refreshToken: string, tokenExpiresAt: number | null) => {
  let storeStr = '{}';
  if (fs.existsSync(MOCK_STORE_FILE)) {
    storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
  }
  const store = JSON.parse(storeStr);
  const now = getNowSec();
  
  if (store[sessionId]) {
    console.log('updating existing session in store with new refresh token:', sessionId);
    const session: Session = store[sessionId];

    let sessionExpiresAt = now + MIN_SESSION_AGE_SEC;
    if (session.rememberMe) {
      sessionExpiresAt = tokenExpiresAt ? Math.min(now + MAX_SESSION_AGE_SEC, tokenExpiresAt) : now + MAX_SESSION_AGE_SEC;
    }

    session.refreshToken = refreshToken;
    session.updatedAt = now;
    session.tokenExpiresAt = tokenExpiresAt;
    session.sessionExpiresAt = sessionExpiresAt;
    
    // reset refresh stats
    session.lastUsedAt = null;
    session.usedCount = 0;

    fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } else {
    console.error('Could not update refresh token - unable to find session:', sessionId);
  }
};

export const sessionRefresh = (sessionId: string, lastUsedAt: number) => {
  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);
    if (store[sessionId]) {
      const session: Session = store[sessionId];

      let sessionExpiresAt = lastUsedAt + MIN_SESSION_AGE_SEC;
      if (session.rememberMe) {
        sessionExpiresAt = session.tokenExpiresAt
          ? Math.min(lastUsedAt + MAX_SESSION_AGE_SEC, session.tokenExpiresAt)
          : lastUsedAt + MAX_SESSION_AGE_SEC;
      }

      session.usedCount++;
      session.lastUsedAt = lastUsedAt;
      session.sessionExpiresAt = sessionExpiresAt;
    }
    fs.writeFileSync(MOCK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  }
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

export const setSessionCookie = (res: Response, sessionId: string, rememberMe: boolean, tokenExpiresInSec: number | null) => {
  const options: cookie.SerializeOptions = {
    httpOnly: true,
    secure: process.argv?.includes('--ssl'),
    sameSite: 'lax',
    path: '/'
  };

  if (rememberMe) {
    // TODO - explain this 
    options.maxAge = tokenExpiresInSec === null ? MAX_SESSION_AGE_SEC : Math.min(tokenExpiresInSec, MAX_SESSION_AGE_SEC);
  }
  // if maxAge is not provided (e.g. rememberMe is false), then this cookie will last as long as the user's browser session,
  // and the cloud session will expire after after MIN_SESSION_AGE_SEC

  const serializedCookie = cookie.serialize(SESSION_COOKIE_NAME, sessionId, options);

  console.log('setting session cookie:', serializedCookie);
  res.set('Set-Cookie', serializedCookie);
};

export const deleteSessionCookie = (res: Response) => {
  const serializedCookie = cookie.serialize(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.argv?.includes('--ssl'),
    sameSite: 'lax',
    maxAge: -1,
    path: '/'
  });

  console.log('setting session cookie for delete:', serializedCookie);
  res.set('Set-Cookie', serializedCookie);
};

export const getProviderParams = (provider: OauthProvider | string | null | undefined) => {
  const params: {
    tokenUrl: string | null; clientId: string | null; clientSecret: string | null
  } = {
    tokenUrl: null, clientId: null, clientSecret: null
  };

  // potentially support other providers in the future
  switch (provider) {
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
        const tokenExpired = !!sess.tokenExpiresAt && sess.tokenExpiresAt <= nowSec;
        const sessionExpired = sess.sessionExpiresAt <= nowSec;
        return {
          sessionExpired,
          tokenExpired,
          sessionId,
          session: {
            provider: sess.provider,
            refreshToken: sess.refreshToken,
            createdAt: `${sess.createdAt} (${ nowSec - sess.createdAt } sec ago)`,
            updatedAt: `${sess.updatedAt} (${ nowSec - sess.updatedAt } sec ago)`,
            lastUsedAt: `${sess.lastUsedAt} ${ sess.lastUsedAt ? `(${ nowSec - sess.lastUsedAt } sec ago)` : '' }`,
            usedCount: sess.usedCount,
            grantLegth: sess.tokenExpiresAt ? `${ sess.tokenExpiresAt - sess.updatedAt } sec` : 'No Expiration',
            tokenExpiresAt: sess.tokenExpiresAt ? `${sess.tokenExpiresAt} (${ sess.tokenExpiresAt - nowSec } sec left)` : 'No Expiration',
            rememberMe: sess.rememberMe,
            sessionExpiresAt: `${sess.sessionExpiresAt} (${ sess.sessionExpiresAt - nowSec } sec left)`,
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
      const now = getNowSec();

      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        const session: Session = store[key];
        const expired = !!session.tokenExpiresAt && session.tokenExpiresAt <= now;

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
