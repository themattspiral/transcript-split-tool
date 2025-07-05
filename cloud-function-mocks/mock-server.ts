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
  const sessions = getAllSessions(sec);
  const expiredCount = sessions.filter((s: any) => s.expired).length;

  res.send(`
    <html>
      <title>Session Store</title>
      <body style="font-family: sans-serif;">
     
        <h4 style="margin-bottom: 5px;">Now:</h4>
        <div style="font-size: 16px;">${sec} (${now.toLocaleString()})</div>

        <h4 style="margin-bottom: 5px;">Current Session ID:</h4>
        <div style="font-size: 16px;">${sessionId || null}</div>

        <h4 style="margin-bottom: 5px;">Session Store (${sessions.length} total, ${expiredCount} expired):</h4>
        <div style="white-space: pre-wrap; font-family: monospace; font-size: 14px;">${JSON.stringify(sessions, null, 2)}</div>

      </body>
    </html>
  `).end();
});

mockServer.get('/admin-expire-sess', (req, res) => {
  res.status(200).json({ expiredCount: expireSessions() }).end();
});

export { mockServer };
