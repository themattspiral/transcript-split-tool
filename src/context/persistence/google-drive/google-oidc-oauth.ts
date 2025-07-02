import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

import { OauthExchangeRequest, OauthProvider } from 'cloud-functions/cloud-function-data';

const STATE_KEY_PREFIX = 'oidc-google.';

const GoogleUserManager: UserManager = new UserManager({
  // allow UserManager to store oauth request state in sessionStorage, so that we can 
  // grab the code verifier upon redirect/return from oauth endpoint
  stateStore: new WebStorageStateStore({ store: sessionStorage, prefix: STATE_KEY_PREFIX }),

  // allows us to immediately cleanup state upon return after grabbing the code verifier (doesn't impact oauth)
  staleStateAgeInSeconds: 0,

  // TEMP - need this to extract the token for now.
  // won't use any client side user storage except in memory with token-exchange via cloud functions
  userStore: new WebStorageStateStore({ store: sessionStorage }),

  authority: import.meta.env.TST_OAUTH_GOOGLE_AUTHORITY_URI,
  metadataUrl: import.meta.env.TST_OAUTH_GOOGLE_METADATA_URI,
  redirect_uri: `${import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_ORIGIN}${import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH}`,
  client_id: import.meta.env.TST_OAUTH_GOOGLE_CLIENT_ID,

  // https://developers.google.com/workspace/drive/api/guides/api-specific-auth
  // https://www.googleapis.com/auth/drive.file:
  //   "Create new Drive files, or modify existing files, that you open with an app
  //    or that the user shares with an app while using the Google Picker API or the app's file picker"
  // Note also:
  // We are explicitly using Oauth for *authorization*, not *authentication*. So we don't
  // request scopes like openid, profile, or email to keep the permissions as simple as possible.
  scope: 'https://www.googleapis.com/auth/drive.file',

  // https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce
  response_type: 'code',
  // PKCE is enabled by default in oidc-client-ts
  // disablePKCE: false,

  // re-add this to get refresh_token once we have token-exchange & refresh via cloud functions in place
  extraQueryParams: {
    access_type: 'offline'
  }
});

export const authorize = () => {
  GoogleUserManager.signinRedirect();
};

export const completeAuthorize = async (rememberMe: boolean): Promise<string> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code) {
    console.error(`Google OIDC oauth completion: No code found in URL:`, window.location.href);
    console.debug('sessionStorage', sessionStorage);
    throw 401;
  }

  const s = sessionStorage.getItem(`${STATE_KEY_PREFIX}${state}`);
  const codeVerifier = JSON.parse(s || '{}')?.code_verifier || null;
  
  if (!codeVerifier) {
    console.error(`Google OIDC oauth completion: No state found matching [${state}]`);
    console.debug('sessionStorage', sessionStorage);
    throw 401;
  }

  // cleanup PKCE flow state entry - cloud function will complete the PKCE flow from here
  GoogleUserManager.clearStaleState();

  const request: OauthExchangeRequest = {
    code,
    codeVerifier,
    redirectUri: GoogleUserManager.settings.redirect_uri,
    provider: OauthProvider.Google,
    rememberMe
  };

  // exchange code for token with cloud function
  const exchangeResponse = await fetch(import.meta.env.TST_OAUTH_EXCHANGE_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!exchangeResponse.ok) {
    throw exchangeResponse.status;
  }

  const response = await exchangeResponse.json();

  return response.accessToken;
};

export const refreshAuthorize = async (): Promise<string> => {
  const refreshResponse = await fetch(import.meta.env.TST_OAUTH_REFRESH_URI, {
    method: 'POST',
    credentials: 'include'
  });

  if (!refreshResponse.ok) {
    throw refreshResponse.status;
  }

  const response = await refreshResponse.json();

  return response.accessToken;
};

export const revoke = async (): Promise<void> => {
  try {
    await fetch(import.meta.env.TST_OAUTH_REVOKE_URI, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.log('Error revoking token', err);
  }
};
