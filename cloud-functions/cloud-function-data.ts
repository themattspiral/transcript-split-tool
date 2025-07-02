export enum OauthProvider {
  Google = 'Google'
}

export interface Session {
  provider: OauthProvider;
  refreshToken: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  usedCount: number;
  tokenExpiresAt: number | null;
  rememberMe: boolean;
  sessionExpiresAt: number;
}

export interface OauthAccessTokenResponse {
  accessToken: string;
  expiresInSec: number;
}

export interface OauthExchangeRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  provider: OauthProvider;
  rememberMe: boolean;
}
