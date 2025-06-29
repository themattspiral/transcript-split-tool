import fs from 'fs';
import express, { Response } from 'express';
import dotenv from 'dotenv';
import cookie from 'cookie';

import { OauthProvider } from '../src/shared/data';

interface Session {
  refreshToken: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  usedCount: number;
}

interface AccessTokenResponse {
  accessToken: string;
  expiresInSec: number;
}

const MOCK_STORE_FILE = './mock-session-store.json';
const SESSION_COOKIE_NAME = 'session_id';

const dotEnvVars: { [varKey: string]: string} = {};
dotenv.config({ processEnv: dotEnvVars, path: ['.env.development','.env.development.local'] });

const dateToSec = (date: Date) => Math.floor(date.getTime() / 1000);
const getNowSec = () => dateToSec(new Date());

const generateSessionId = (): string => {
  return crypto.randomUUID();
}

const getSession = (sessionId: string): Session | null => {
  if (fs.existsSync(MOCK_STORE_FILE)) {
    const storeStr = fs.readFileSync(MOCK_STORE_FILE, 'utf8');
    const store = JSON.parse(storeStr);
    return store[sessionId] || null;
  } else {
    return null;
  }
};

const incrementUsedCount = (sessionId: string, lastUsedAt: number): number => {
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

const createSessionOrRotateRefreshToken = (sessionId: string, refreshToken: string, tokenExpiresAt: number | null) => {
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

const deleteSession = (sessionId?: string | null) => {
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

const setSessionCookie = (res: Response, sessionId: string, expiresInSec: number, expiresAtSec: number) => {
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

const deleteSessionCookie = (res: Response) => {
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

const getTokenParams = (oauthProvider: string | null | undefined) => {
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
const getAllSessions = (nowSec: number): any[] => {
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
const expireSessions = (): number => {
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


/*** Mock Server / Handler function definition ***/
/*************************************************/

const mockServer = express();
mockServer.use(express.json());

// exchange PKCE code for access token (and refresh token)
mockServer.post('/oauth-exchange', async (req, res) => {
  console.log('---- 1 EXCHANGE ----');

  try {
    if (!req.body) {
      res.status(400).json({ message: 'Missing required params' }).end();
      return;
    }

    const { code, codeVerifier, redirectUri, oauthProvider } = req.body;

    if (!code || !codeVerifier || !redirectUri || !oauthProvider) {
      res.status(400).json({ message: 'Missing required params' }).end();
      return;
    }

    const { tokenUrl, clientId, clientSecret } = getTokenParams(oauthProvider);

    if (!tokenUrl || !clientId) {
      res.status(400).json({ message: 'Invalid provider' }).end();
      return;
    }

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri
    });

    if (clientSecret) {
      // client_secret SHOULD NOT be needed for PKCE flow, but Google OAuth requires it,
      // seemingly because the client was created as a web app. however, PKCE is still used -
      // (code + code_verifier must be correct) so we still have better security, and the 
      // client secret remains private here on the server side.
      bodyParams.append('client_secret', clientSecret);
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString()
    });

    const tokens: any = await tokenResponse.json();

    // temp
    console.log('token exchange response:', tokens);

    if (!tokenResponse.ok || tokens.error) {
      console.error('Token exchange error:', tokenResponse.status, tokens.error_description || undefined, tokens.error || undefined);

      // send a minimum of info to client here because they are not authorized when using this endpoint
      res
        .status(tokenResponse.status === 401 || tokenResponse.status === 403 ? 401 : 500)
        .json({ message: 'Token exchange error.' }).end();
      return;
    }

    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokens;

    if (!refresh_token) {
      // shouldn't happen, but just in case
      console.warn('No refresh token received. Ensure "offline_access" scope is requested.');
      res.status(401).json({ message: 'No refresh token provided. Please reauthorize.' });

      // TODO - decide if i want to just pass the access token through anyway...?

      if (access_token) {
        try {
          console.log('revoking access token in attempt to force refresh token to be issued on next auth');

          await fetch(dotEnvVars.MOCK_OAUTH_GOOGLE_REVOKE_URI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              token: access_token,
              client_id: dotEnvVars.TST_OAUTH_GOOGLE_CLIENT_ID
            }).toString()
          });

          console.log('revoked access token');
        } catch (err) {
          console.log('error revoking access token:', err);
        }
      }

      return;
    }

    const expiresAtSec: number = getNowSec() + refresh_token_expires_in;
    const sessionId = generateSessionId();

    createSessionOrRotateRefreshToken(sessionId, refresh_token, expiresAtSec);
    setSessionCookie(res, sessionId, refresh_token_expires_in, expiresAtSec);

    const response: AccessTokenResponse = {
      accessToken: access_token,
      expiresInSec: expires_in
    };
    res.status(200).json(response).end();
  } catch (err) {
    console.error('Error during code exchange:', err);
    res.status(500).json({ message: 'Internal server error during token exchange.' }).end();
  }

  console.log('---- complete: 1 (exchange)  ----');
  console.log('');
});

// get a new access token using stored session refresh token for the current user
mockServer.post('/oauth-refresh', async (req, res) => {
  console.log('---- 2 REFRESH ----');

  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies[SESSION_COOKIE_NAME];

    if (!sessionId) {
      res.status(401).json({ message: 'Invalid session. Please reauthorize.' }).end();
      return;
    }

    const session = getSession(sessionId);

    if (!session) {
      res.status(401).json({ message: 'Invalid session. Please reauthorize.' }).end();
      return;
    } else if (session.expiresAt && session.expiresAt < getNowSec()) {
      deleteSession(sessionId);
      deleteSessionCookie(res);
      res.status(401).json({ message: 'Expired session. Please reauthorize.' }).end();
      return;
    } else if (!session.refreshToken) {
      console.log('session missing refresh token (deleting anyway):', sessionId, session);
      deleteSession(sessionId);
      deleteSessionCookie(res);
      res.status(401).json({ message: 'Invalid data. Please reauthorize.' }).end();
      return;
    }

    const { tokenUrl, clientId, clientSecret } = getTokenParams(req.body?.oauthProvider);
      
    if (!tokenUrl || !clientId) {
      res.status(400).json({ message: 'Invalid provider' }).end();
      return;
    }

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: session.refreshToken
    });

    if (clientSecret) {
      // client_secret SHOULD NOT be needed for PKCE flow, but Google OAuth requires it,
      // seemingly because the client was created as a web app. however, PKCE is still used -
      // (code + code_verifier must be correct) so we still have better security, and the 
      // client secret remains private here on the server side.
      bodyParams.append('client_secret', clientSecret);
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString()
    });

    const tokens: any = await tokenResponse.json();

    // temp
    console.log('token refresh response:', tokens);

    if (!tokenResponse.ok || tokens.error) {
      console.error('Token refresh error:', tokenResponse.status, tokens.error_description || undefined, tokens.error || undefined);

      // if the refresh call returns unauthorized, the refresh token is no longer useful,
      // so invalidate the local session as well
      if (tokenResponse.status === 401 || tokenResponse.status === 403) {
        console.log('Got explicit 401 from refresh - deleting session in response');
        deleteSession(sessionId);
        deleteSessionCookie(res);
      }

      // provide more error info to previously-authorized client
      res
        .status(tokenResponse.status === 401 || tokenResponse.status === 403 ? 401 : 500)
        .json({ message: 'Token refresh error.', error: tokens.error_description || tokens.error });
      return;
    }

    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokens;

    const nowSec = getNowSec();
    const expiresAtSec: number = nowSec + refresh_token_expires_in;

    // handle refresh token rotation
    if (refresh_token && refresh_token !== session.refreshToken) {
      console.log('ROTATION - refresh token rotated for session:', sessionId);
      console.log('  old expiration:', session.expiresAt);
      console.log('  new expiration:', expiresAtSec);
    
      createSessionOrRotateRefreshToken(sessionId, refresh_token, expiresAtSec);
      setSessionCookie(res, sessionId, refresh_token_expires_in, expiresAtSec);
    } else {
      const usedCount = incrementUsedCount(sessionId, nowSec);
      console.log('No refresh token rotation. Incremented usedCount for session:', sessionId, ` - usedCount: ${usedCount}`);
      // todo - update cookie expiration
    }

    const response: AccessTokenResponse = {
      accessToken: access_token,
      expiresInSec: expires_in
    };
    res.status(200).json(response).end();
  } catch (err) {
    console.error('Error during token refresh:', err);
    res.status(500).json({ message: 'Internal server error during token refresh.' }).end();
  }

  console.log('---- complete: 2 (refresh)  ----');
  console.log('');
});

// revoke
// revoke refresh token if available, otherwise revoke the access token the client sent
// get a new access token using stored session refresh token for the current user
mockServer.post('/oauth-revoke', async (req, res) => {
  console.log('---- 3 REVOKE  ----');

  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    res.status(401).json({ message: 'Invalid session (no cookie). Please reauthorize.' }).end();
    return;
  }
  
  let tokenToRevoke = null;
  const session = getSession(sessionId);
  if (session?.refreshToken) {
    tokenToRevoke = session.refreshToken;
  }

  try {
    if (tokenToRevoke) {
      console.log('revoking refresh token for session:', sessionId);

      await fetch(dotEnvVars.MOCK_OAUTH_GOOGLE_REVOKE_URI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: tokenToRevoke,
          client_id: dotEnvVars.TST_OAUTH_GOOGLE_CLIENT_ID
        }).toString()
      });
    } else {
      console.log('no refresh token tok revoke - skipping revoke call for session:', sessionId);
    }
  } catch (err) {
    console.error('Error during token revoke:', err);
    // swallow the error - from our perspective we will still successfully purge authorization
  } finally {
    deleteSession(sessionId);
    deleteSessionCookie(res);
    console.log('revoke complete - deleted session:', sessionId);
    res.status(200).end();
  }

  console.log('---- complete: 3 (revoke)  ----');
  console.log('');
});

mockServer.get('/admin-sess', (req, res) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies[SESSION_COOKIE_NAME];

  const now = new Date();
  const sec = dateToSec(now);

  res.json({
    currentSessionId: sessionId || null,
    now: `${sec} (${now.toLocaleString()})`,
    sessions: getAllSessions(sec)
  }).end();
});

mockServer.get('/admin-expire-sess', (req, res) => {
  res.status(200).json({ expiredCount: expireSessions() }).end();
});

export { mockServer };
