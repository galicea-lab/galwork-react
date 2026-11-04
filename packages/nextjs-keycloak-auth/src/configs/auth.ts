// configs/auth.ts

import keycloakConfig, { KeycloakConfig } from './keycloak';

export type TAuthConfig = {
  clientId: string;
  tokenEndpoint: string;
  scope: string;
  storageKey: string;
  storageVerifierKeyName: string;
  storagePathKeyName: string;
};

export const buildAuthConfig = (config: KeycloakConfig): TAuthConfig => ({
  clientId: config.keycloak_client,
  tokenEndpoint: config.keycloak + '/protocol/openid-connect/token',
  scope: 'profile openid',
  storageKey: 'keycloakAuthTokens', // Jeden klucz do przechowywania JSON z wszystkimi tokenami
  storageVerifierKeyName: 'keycloakVerifier', // PKCE verifier
  storagePathKeyName: 'keycloakRedirectPath', // Ścieżka powrotu po logowaniu
});

const authConfig: TAuthConfig = buildAuthConfig(keycloakConfig);

export interface TTokenRqBase {
  grant_type: string;
  client_id: string;
  redirect_uri?: string; 
}

export interface TTokenRequestWithCodeAndVerifier extends TTokenRqBase {
  code: string;
  code_verifier: string;
}

export interface TTokenRequestForRefresh extends TTokenRqBase {
  scope?: string;
  refresh_token: string;
}

export type TTokenRequest = TTokenRequestWithCodeAndVerifier | TTokenRequestForRefresh;

export type TAuthToken = {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in?: number; // Czas życia access_token w sekundach
  refresh_token?: string;
  refresh_expires_in?: number; // Czas życia refresh_token
  id_token?: string;
  /**
   * Czas wygaśnięcia access_token w milisekundach (timestamp).
   * Obliczany i dodawany przy zapisywaniu tokenu w `storeAuthTokens`.
   */
  expires_at?: number;
};

// ## PODSTAWOWE FUNKCJE ZARZĄDZANIA PAMIĘCIĄ ##

export const storeAuthTokens = (tokens: TAuthToken) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Oblicz i zapisz dokładny czas wygaśnięcia (w milisekundach)
    if (tokens.expires_in) {
      // Ustawiamy bufor, aby odświeżyć token chwilę PRZED jego faktycznym wygaśnięciem
      const bufferSeconds = 60;
      tokens.expires_at = Date.now() + (tokens.expires_in - bufferSeconds) * 1000;
    }
    sessionStorage.setItem(authConfig.storageKey, JSON.stringify(tokens));
  } catch (error) {
    console.error("Failed to store auth tokens:", error);
  }
};

export const getAuthTokens = (): TAuthToken | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = sessionStorage.getItem(authConfig.storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to parse auth tokens:", error);
    return null;
  }
};

export const removeAuthTokens = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(authConfig.storageKey);
};

export const storeVerifier = (verifier: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(authConfig.storageVerifierKeyName, verifier);
  }
};
export const getVerifier = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(authConfig.storageVerifierKeyName);
  }
  return null;
};
export const removeVerifier = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(authConfig.storageVerifierKeyName);
  }
};

export const storePath = (path: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(authConfig.storagePathKeyName, path);
  }
};
export const getPath = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(authConfig.storagePathKeyName);
  }
  return null;
};
export const removePath = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(authConfig.storagePathKeyName);
  }
};

// parametr URL strony logowania wskazujący miejsce, do
// którego wracamy po udanym logowaniu, np. /login?returnTo=%2Ftasks
export const RETURN_TO_PARAM = 'returnTo';

// przyjmujemy tylko ścieżki względne w obrębie aplikacji
// ("/..."), bez "//host" i "/\host" - inaczej parametr returnTo dałoby się
// użyć jako otwartego przekierowania na obcą domenę.
export const sanitizeReturnPath = (path: string | null | undefined): string | null => {
  if (!path || !path.startsWith('/')) return null;
  if (path.startsWith('//') || path.startsWith('/\\')) return null;
  return path;
};

// czy ścieżka (z ewentualnym query i końcowym "/") wskazuje
// na stronę `page` (np. 'login') - powrót na samą stronę logowania nie ma sensu.
export const isPagePath = (path: string, page: string): boolean => {
  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return pathname === '/' + page.replace(/^\/+|\/+$/g, '');
};

// link do strony logowania z miejscem powrotu.
export const buildLoginHref = (returnPath?: string | null, loginPage = '/login'): string => {
  const safe = sanitizeReturnPath(returnPath);
  if (!safe || isPagePath(safe, loginPage)) return loginPage;
  return `${loginPage}?${RETURN_TO_PARAM}=${encodeURIComponent(safe)}`;
};

export const clearAllAuthRelatedStorage = () => {
  removeAuthTokens();
  removeVerifier();
  removePath();
};


export default authConfig;