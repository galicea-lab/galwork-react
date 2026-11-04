// components/LoginPage.tsx

import { Icon } from '@iconify/react';
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router.js";
import { fetchTokens } from '../api/keycloak'; 
import { useAuth } from "../hooks/useAuth";
import Login from './LoginButton'; 
import { buildAuthConfig, 
   getPath, removePath,
   sanitizeReturnPath, isPagePath, RETURN_TO_PARAM,
   getVerifier, 
   removeVerifier, TAuthToken, storeAuthTokens } from "../configs/auth"; 
import defaultKeycloakConfig, { KeycloakConfig } from "../configs/keycloak";
import { parseJwt } from "../utils/jwt";
import { UserDataType } from "../context/types";

type TLoginPageParams = {
  keycloakConfig?: KeycloakConfig
}

const LoginPage = ({ keycloakConfig }: TLoginPageParams = {}) => {
  const keycloak = keycloakConfig ?? defaultKeycloakConfig
  const { t } = useTranslation();
  const auth = useAuth()
  const router = useRouter()
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLoginComponent, setShowLoginComponent] = useState<boolean>(false);
  const codeExchangeStarted = useRef(false); // jednorazowe użycie kodu autoryzacyjnego

  const handleLoginGovPlCallback = async (token: string) => {
    setLoadingMessage('Logowanie przez login.gov.pl...');
    setErrorMessage(null);

    try {
      // Opcjonalnie: weryfikacja JWT na frontendzie (jwks)
      // Ale: ufamy backendowi → wystarczy sparsować

      const jwtPayload = parseJwt(token);
      if (!jwtPayload) throw new Error('Invalid token');

      const userData: UserDataType = {
        username: jwtPayload.preferred_username || '',
        email: jwtPayload.email || jwtPayload.preferred_username || '',
        roles: jwtPayload.realm_access?.roles || [],
        groups: jwtPayload.realm_access?.roles || [],
      };

      // Zapisz token w localStorage
      const authToken: TAuthToken = {
        access_token: token,
        // refresh_token nie istnieje → ustaw null lub pomiń
        token_type: 'Bearer',
        expires_in: jwtPayload.exp ? jwtPayload.exp - Math.floor(Date.now() / 1000) : 3600,
        scope: ""
      };

      storeAuthTokens(authToken);
      auth.setAuthToken(authToken);
      auth.setUser(userData);

      removeVerifier();
      // 2026-10-28: removePath() przeniesione do redirectToStoredPath -
      // wcześniej ścieżka powrotu ginęła przed przekierowaniem.
      setLoadingMessage(null);
    } catch (err) {
      console.error('login.gov.pl login failed:', err);
      setErrorMessage('Błąd logowania przez login.gov.pl');
      setLoadingMessage(null);
      setShowLoginComponent(true);
    }
  };

  // 2026-10-28: cel po udanym logowaniu: ?returnTo=... z bieżącego URL,
  // potem ścieżka zapisana przez LoginButton przed wyjściem do Keycloaka,
  // a w razie braku (lub gdy wskazuje na samą stronę logowania) - '/'.
  const redirectToStoredPath = () => {
    const fromQuery = new URLSearchParams(window.location.search).get(RETURN_TO_PARAM);
    const target = sanitizeReturnPath(fromQuery) ?? sanitizeReturnPath(getPath());
    removePath(); // Usuń ścieżkę po użyciu
    router.replace(target && !isPagePath(target, 'login') ? target : '/');
  }

  const handleKeycloakCallback = (code : string, verifier : any) => {
    setLoadingMessage('Potwierdzanie tożsamości...');
    setErrorMessage(null); // Wyczyść poprzednie błędy

    fetchTokens(buildAuthConfig(keycloak), code, verifier, 'login')
      .then((token: TAuthToken) => {
        auth.setAuthToken(token) // Ustaw token w kontekście
        storeAuthTokens(token)

        removeVerifier(); // Usuń verifier po użyciu
        setLoadingMessage('Ustalanie uprawnień...');
        // api_keycloak_access zwraca dodatkowe dane
        // Po pomyślnym pobraniu i ustawieniu tokenów, AuthProvider powinien zaktualizować stan user
        // i przekierować.
  
        const jwtToken = parseJwt(token.access_token);

        if (jwtToken) {
          try {
            const userData: UserDataType = {
              username: jwtToken.preferred_username,
              email: jwtToken.email ? jwtToken.email : jwtToken.preferred_username,
              roles: jwtToken.realm_access?.roles || [],
              groups: jwtToken.realm_access?.roles || [],
              id: 1,
              role: "admin", // obsolete
              idToken: token.access_token, // obsolete
              userIdent: jwtToken.email ? jwtToken.email : jwtToken.preferred_username
            };
            auth.setUser(userData);
          } catch (error) {
            console.error(error);
          }
        }
        setLoadingMessage(null)
      })
      .catch((error: Error) => {
        console.error("Login failed!:", error);
        setErrorMessage('Nie można pobrać tokenu autoryzacji. Spróbuj ponownie.');
        setLoadingMessage(null);
        setShowLoginComponent(true);
        removeVerifier();
      })
  }

  useEffect(() => {
    if (codeExchangeStarted.current) return; // kod/token już wymieniany - nie powtarzaj

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const token = urlParams.get('token'); // ← NOWE
    const verifier = getVerifier();

    // 1. Już zalogowany?
    // samo przekierowanie robi efekt poniżej (jedno miejsce).
    if (auth.authToken && auth.user) {
      return;
    }

    // 2. Keycloak: ?code=...
    if (code && verifier) {
      codeExchangeStarted.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazowa obsługa parametrów URL po powrocie z Keycloaka, nie subskrypcja
      handleKeycloakCallback(code, verifier);
      return;
    }

    // 3. login.gov.pl: ?token=...
    if (token) {
      codeExchangeStarted.current = true;
       
      handleLoginGovPlCallback(token);
      return;
    }

    // 4. Brak parametrów → pokaż przyciski logowania
    // świeże wejście na stronę logowania - porzucamy ścieżkę
    // z dawnej, niedokończonej próby; miejsce powrotu wyznacza teraz ?returnTo.
    removePath();
    setShowLoginComponent(true);
    // handleKeycloakCallback/handleLoginGovPlCallback/redirectToStoredPath celowo pominięte:
    // nie są memoizowane, a codeExchangeStarted chroni przed powtórnym wywołaniem przy zmianie `auth`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, router]);

//////////////////

  // Efekt do obsługi przekierowania po otrzymaniu tokena i danych użytkownika
  useEffect(() => {
    // 2026-10-28: po udanym logowaniu zawsze wychodzimy ze strony
    // logowania - do miejsca wywołania albo na stronę główną.
    if (auth.authToken && auth.user && !auth.loading) {
      redirectToStoredPath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authToken, auth.user, auth.loading, router ]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
          {t('Logowanie')}
        </h1>

        {loadingMessage && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Icon icon="mdi:loading" className="animate-spin" fontSize={20} />
            <span>{loadingMessage}</span>
          </div>
        )}

        {errorMessage && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {showLoginComponent && (
          <div className="flex justify-center">
            <Login page='login' keycloakConfig={keycloak} />
          </div>
        )}

        {/* Przycisk Wróć powinien być widoczny tylko, jeśli jesteśmy w stanie, gdzie można wrócić */}
        {getPath() && !auth.loading && !showLoginComponent && (
          <div className="flex justify-center">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              onClick={() => {
                router.push({ pathname: getPath() || '/', query: {} });
                removePath(); // Usuń ścieżkę po użyciu
              }}
            >
              <Icon icon="mdi:arrow-left" fontSize={18} />
              {t('Back')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


export default LoginPage