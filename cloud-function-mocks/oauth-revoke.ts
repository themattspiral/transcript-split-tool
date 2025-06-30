import cookie from 'cookie';
import { Request, Response } from 'express';

import { deleteSession, deleteSessionCookie, getDotEnvVars, getSession, SESSION_COOKIE_NAME } from './mock-util';

const dotEnvVars = getDotEnvVars();

const oauthRevoke = async (req: Request, res: Response) => {
  console.log('---- 3 REVOKE  ----');

  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    res.status(401).json({ message: 'Invalid session (no cookie). Please reauthorize.' }).end();
    return;
  }
  
  let tokenToRevoke: string | null = null;
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
      console.log('no refresh token to revoke - skipping revoke call for session:', sessionId);
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
};

export default oauthRevoke;
