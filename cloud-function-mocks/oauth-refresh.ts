import cookie from 'cookie';
import { Request, Response } from 'express';

import {
  AccessTokenResponse, createSessionOrRotateRefreshToken, deleteSession, deleteSessionCookie, 
  getNowSec, getSession, getTokenParams, incrementUsedCount,
  SESSION_COOKIE_NAME, setSessionCookie
} from './mock-util';

const oauthRefresh = async (req: Request, res: Response) => {
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
};

export default oauthRefresh;
