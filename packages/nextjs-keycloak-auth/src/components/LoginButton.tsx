// components/LoginButton.tsx

import { Icon } from '@iconify/react';
import { useTranslation } from "react-i18next";
import pkceChallenge from 'pkce-challenge'

import { useAuth } from "../hooks/useAuth";
import { storeVerifier, storePath, getPath, sanitizeReturnPath, isPagePath, RETURN_TO_PARAM } from "../configs/auth";
import { keycloak_url, redirectUri } from "../api/keycloak";
import defaultKeycloakConfig, { KeycloakConfig } from '../configs/keycloak';
import LogoutButton from './LogoutButton';

type TLoginParams = {
  page?: string
  keycloakConfig?: KeycloakConfig
  /** Dokąd wrócić po udanym logowaniu (zob. storePath/getPath,
   * LoginPage::redirectToStoredPath). Domyślnie: bieżąca strona w chwili
   * kliknięcia "Zaloguj" - NIE strona `page` (ta służy wyłącznie do
   * zbudowania technicznego redirect_uri dla Keycloaka, zawsze '/login'). */
  /* 2026-10-28: gdy przycisk stoi na samej stronie logowania (`page`),
   * domyślne miejsce powrotu bierzemy z parametru ?returnTo=..., a w razie
   * jego braku z poprzedniej (nieudanej) próby albo '/'. */
  returnPath?: string
}

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-600 text-lg font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

// 2026-10-28: minimalne wymiary inline - klasy Tailwinda z tej biblioteki
// działają tylko, jeśli konsument skanuje jej dist w `content` swojego
// tailwind.config; bez tego przycisk zwężał się i obcinał napis.
const primaryButtonStyle = {
  minWidth: '12rem',
  padding: '0.75rem 1.5rem',
  whiteSpace: 'nowrap',
} as const

const resolveReturnPath = (params: TLoginParams): string => {
  if (params.returnPath) return params.returnPath
  const { pathname, search } = window.location
  if (!isPagePath(pathname, params.page ?? 'login')) return pathname + search
  const fromQuery = new URLSearchParams(search).get(RETURN_TO_PARAM)
  return sanitizeReturnPath(fromQuery) ?? sanitizeReturnPath(getPath()) ?? '/'
}

const LoginButton = (params: TLoginParams) => {
  const auth = useAuth()
  const { t } = useTranslation()

  const keycloakConfig = params.keycloakConfig ?? defaultKeycloakConfig

  const startLogin = () => {
    const returnPath = resolveReturnPath(params)

    pkceChallenge().then((pkce) => {
      storeVerifier(pkce.code_verifier || '')
      storePath(returnPath)

      const uri = keycloak_url('auth', keycloakConfig)
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: keycloakConfig.keycloak_client,
        redirect_uri: redirectUri('login'),
        code_challenge: pkce.code_challenge,
        code_challenge_method: 'S256',
      })
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- external redirect to the Keycloak login server, not an internal Next.js route
      window.location.assign(`${uri}?${authParams.toString()}`)
    })
  }

  if (auth.user?.username) {
    return (
      <LogoutButton />
    )
  }

  return (
    <button className={primaryButtonClass} style={primaryButtonStyle} onClick={startLogin}>
      <Icon icon="mdi:login" fontSize={28} />
      {t('Login')}
    </button>
  )
}

export default LoginButton

