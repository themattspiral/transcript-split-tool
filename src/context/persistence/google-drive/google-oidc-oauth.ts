import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';

// TODO - remove secret (recreate app as Desktop)
const GoogleUserManager: UserManager = new UserManager({
  // let UserManager store state in sessionStorage so that we can grab the code verifier upon redirect/return
  stateStore: new WebStorageStateStore({ store: window.sessionStorage, prefix: 'oidc-google.' }),

  // TODO, either comment this or raise it or test cleanup without it
  // allows us to immediately cleanup state upon return after grabbing the code verifier (doesn't impact oauth)
  staleStateAgeInSeconds: 0,

  // TEMP using localstorage while in early dev stages - won't use any user storage with token-exchange via cloud functions
  userStore: new WebStorageStateStore({ store: window.localStorage }),

  authority: import.meta.env.TST_OAUTH_GOOGLE_AUTHORITY_URI,
  metadataUrl: import.meta.env.TST_OAUTH_GOOGLE_METADATA_URI,
  redirect_uri: import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_URI,
  client_id: import.meta.env.TST_OAUTH_GOOGLE_CLIENT_ID,
  
  // TODO - remove secret (recreate app as Desktop)
  client_secret: import.meta.env.TST_OAUTH_GOOGLE_CLIENT_SECRET,

  // https://developers.google.com/workspace/drive/api/guides/api-specific-auth
  // "Create new Drive files, or modify existing files, that you open with an app
  // or that the user shares with an app while using the Google Picker API or the app's file picker"
  scope: 'https://www.googleapis.com/auth/drive.file',

  // https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce
  response_type: 'code',
  // PKCE is enabled by default in oidc-client-ts

  // re-add this to get refresh_token once we have token-exchange & refresh via cloud functions in place
  // extraQueryParams: {
  //   access_type: 'offline'
  // }
});

export const authorize = () => {
  GoogleUserManager.signinRedirect();
};

export const completeAuthorize = async (): Promise<string | null> => {
  // get code and verifier
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  // console.log('code', code);
  // console.log('state', state);

  const s = sessionStorage.getItem(`oidc-google.${state}`);
  if (s) {
    // const so = JSON.parse(s);
    // console.log('cv:', so?.code_verifier);
  }
  
  // TODO - exchange for token

  // cleanup PKCE flow state entry - cloud function will complete the PKCE flow from here
  // googleOidc.clearStaleState();

  // Clean up URL: remove code and state
  // TODO - change this when adding router
  // window.history.replaceState({}, '', window.location.origin);

  // TEMP - complete auth on frontend
  // TODO - replace with token-exchange / refresh flow with cloud functions
  // const oauthUser = await GoogleUserManager.getUser();
  // if (oauthUser) {
  //     console.log('already signed in, not processing callback again');
  //     console.log('user:', user);
  // } else {
  //   //
  // }

  // TEMP - complete code token-exchange on frontend
  const user: User | undefined = await GoogleUserManager.signinCallback();
  if (user && user.access_token) {
    console.log('Callback processed - User logged in:', user);

    const token = user.access_token;

    window.history.replaceState({}, '', window.location.origin);

    await GoogleUserManager.removeUser();

    return token;
  } else {
    console.log('Callback couldnt process User:', user);
    return null;
  }
};

export const revoke = async (token: string | null) => {
  if (!token) {
    console.log('no token to revoke');
    GoogleUserManager.removeUser();
    GoogleUserManager.clearStaleState();
    return;
  }
  
  try {
    // TODO replace with call to /revoke cloud function
    await fetch(import.meta.env.TST_OAUTH_GOOGLE_REVOKE_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `token=${encodeURIComponent(token)}&client_id=${encodeURIComponent(GoogleUserManager.settings.client_id)}`
    });
  } catch (err) {
    console.log('Error revoking token');
  }
  
  GoogleUserManager.removeUser();
  GoogleUserManager.clearStaleState();
};
