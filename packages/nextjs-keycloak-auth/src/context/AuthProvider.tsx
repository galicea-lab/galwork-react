import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthValuesType, UserDataType } from './types';
import { clearAllAuthRelatedStorage, TAuthToken, getAuthTokens, storeAuthTokens, buildAuthConfig }
  from '../configs/auth';
import defaultKeycloakConfig, { KeycloakConfig } from '../configs/keycloak';
import { parseJwt } from '../utils/jwt';

// Funkcja sprawdzająca wygaśnięcie tokena z marginesem
function isTokenAboutToExpire(token: string, marginSeconds = 60): boolean {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  const now = Date.now() / 1000;
  return decoded.exp < now + marginSeconds;
}

const defaultAuthContext: AuthValuesType = {
  user: {
    username: '',
    email: '',
    roles: [],
    id: 1,
    role: 'admin', // obsolete
    groups : ['editor', 'viewer'],
    idToken: '',
    userIdent: '',
  },
  loading: true,
  authToken: null,
  setUser: () => null,
  setAuthToken: () => null,
  setLoading: () => null,
  logout: () => Promise.resolve(),
};

export const AuthContext = createContext(defaultAuthContext);

type AuthProps = {
  children: ReactNode;
  /** Zob. LoginPage/LoginButton - musi być ten sam obiekt, który dostają
   * one, inaczej odświeżanie tokenu (refreshToken poniżej) trafia w zły
   * realm/client (bug: wcześniej AuthProvider zawsze używał domyślnego
   * keycloakConfig z configs/keycloak.ts, niezależnie od tego, co
   * faktycznie skonfigurował konsument biblioteki). */
  keycloakConfig?: KeycloakConfig;
};

export const AuthProvider = ({ children, keycloakConfig }: AuthProps) => {
  const authConfig = useMemo(
    () => buildAuthConfig(keycloakConfig ?? defaultKeycloakConfig),
    [keycloakConfig],
  );
  const [user, setUser] = useState<UserDataType | null>(defaultAuthContext.user);
  const [loading, setLoading] = useState<boolean>(defaultAuthContext.loading);
  const [authToken, setAuthTokenState] = useState<TAuthToken | null>(null);

  // Ref umożliwiający stabilność refreshToken niezależnie od zmian stanu authToken
  const authTokenRef = useRef(authToken);
  //? authTokenRef.current = authToken;

  // Stabilizowana funkcja setAuthToken
  const setAuthToken = useCallback((token: TAuthToken | null) => {
    setAuthTokenState(token);
    if (token) {
      storeAuthTokens(token);
    } else {
      clearAllAuthRelatedStorage();
    }
  }, []);

  // Stabilizowana funkcja logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    setLoading(false);
  }, [setAuthToken]);

  // Stabilizowana funkcja refreshToken
  const refreshToken = useCallback(async () => {
    const token = authTokenRef.current;
    if (!token?.refresh_token) {
      console.warn('No refresh token available, logging out.');
      handleLogout();
      return null;
    }

    try {
      const response = await fetch(authConfig.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: authConfig.clientId,
          refresh_token: token.refresh_token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Refresh token failed:', errorData);
        throw new Error('Refresh token failed');
      }

      const newToken: TAuthToken = await response.json();
      setAuthToken(newToken);

 
      const jwt = parseJwt(newToken.access_token);
     /*
      if (jwt) {
        const userData: UserDataType = {
          roles: jwt.realm_access?.roles || [],
          groups:  [], //?
          username: jwt.preferred_username || '',
          email: jwt.email || '',
        };
        setUser(userData);
      }
      */

    if (jwt) {
      // Pobieramy role globalne oraz role przypisane bezpośrednio do tego klienta
      const realmRoles = jwt.realm_access?.roles || [];
      const clientRoles = jwt.resource_access?.[authConfig.clientId]?.roles || [];
      const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

      const userData: UserDataType = {
        roles: allRoles,
        groups: Array.isArray(jwt.groups) ? jwt.groups : [],
        username: jwt.preferred_username || '',
        email: jwt.email || '',
      };

      setUser(userData);
    }
      return newToken;
    } catch (err) {
      console.error('Token refresh failed', err);
      handleLogout();
      return null;
    }
  }, [handleLogout, setAuthToken, authConfig]);

  // Inicjalizacja autentykacji (uruchamia się raz)
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const stored = getAuthTokens();

      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const jwt = parseJwt(stored.access_token);
        if (jwt) {
          const userData: UserDataType = {
            roles: jwt.realm_access?.roles || [],
            groups: [], // todo
            username: jwt.preferred_username || '',
            email: jwt.email || '',
          };
          setUser(userData);
          setAuthToken(stored);
        }

        if (isTokenAboutToExpire(stored.access_token, 30)) {
          await refreshToken();
        }
      } catch (e) {
        console.error('Error initializing authentication or parsing tokens:', e);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshToken, handleLogout, setAuthToken]);

  // Automatyczny refresh tokenów w tle
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (authToken?.access_token) {
      const decoded = parseJwt(authToken.access_token);
      if (decoded && decoded.exp) {
        const expiresInSeconds = decoded.exp - Date.now() / 1000;
        const refreshThreshold = 60;
        const timeout = Math.max(1, (expiresInSeconds - refreshThreshold)) * 1000;

        intervalId = setTimeout(async () => {
          if (isTokenAboutToExpire(authToken.access_token, refreshThreshold)) {
            await refreshToken();
          }
        }, timeout);
      }
    }

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [authToken?.access_token, refreshToken]);

  const value = useMemo<AuthValuesType>(
    () => ({
      user,
      loading,
      authToken,
      setUser,
      setAuthToken,
      setLoading,
      logout: handleLogout,
    }),
    [user, loading, authToken, setUser, setLoading, setAuthToken, handleLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;