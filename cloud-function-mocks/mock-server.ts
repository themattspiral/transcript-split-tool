import express from 'express';
import cookie from 'cookie';

import { dateToSec, expireSessions, getAllSessions, SESSION_COOKIE_NAME } from './mock-util';

import oauthExchange from './oauth-exchange';
import oauthRefresh from './oauth-refresh';
import oauthRevoke from './oauth-revoke';

/*** Mock Server / Cloud function definitions ***/
/************************************************/

const mockServer = express();
mockServer.use(express.json());

// exchange PKCE code for access token (and refresh token)
mockServer.post('/oauth-exchange', oauthExchange);

// get a new access token using stored session refresh token for the current user
mockServer.post('/oauth-refresh', oauthRefresh);

// revoke
// revoke refresh token if available, otherwise revoke the access token the client sent
// get a new access token using stored session refresh token for the current user
mockServer.post('/oauth-revoke', oauthRevoke);

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
