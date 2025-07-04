import { Request, Response } from 'express';

import {
  createSession, getDotEnvVars, getNowSec, getProviderParams, setSessionCookie
} from './mock-util';
import { OauthAccessTokenResponse, OauthExchangeRequest } from '../cloud-functions/cloud-function-data';

const dotEnvVars = getDotEnvVars();

const oauthExchange = async (req: Request, res: Response) => {
  console.log('---- 1 EXCHANGE ----');

  try {
    if (!req.body) {
      res.status(400).json({ message: 'Missing required params' }).end();
      return;
    }

    const { code, codeVerifier, redirectUri, provider, rememberMe }: OauthExchangeRequest = req.body;

    if (!code || !codeVerifier || !redirectUri || !provider) {
      res.status(400).json({ message: 'Missing required params' }).end();
      return;
    }

    // ensure it's a boolean
    const isRememberMeSession = rememberMe === true;

    const { tokenUrl, clientId, clientSecret } = getProviderParams(provider);

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

      res.status(401).json({ message: 'No refresh token provided. Please reauthorize.' }).end();
      return;
    }

    const tokenExpiresAtSec: number | null = refresh_token_expires_in
      ? getNowSec() + refresh_token_expires_in
      : null;
    
    const sessionId = createSession(provider, refresh_token, tokenExpiresAtSec, isRememberMeSession);
    setSessionCookie(res, sessionId, isRememberMeSession, refresh_token_expires_in);

    const response: OauthAccessTokenResponse = {
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
};

export default oauthExchange;
