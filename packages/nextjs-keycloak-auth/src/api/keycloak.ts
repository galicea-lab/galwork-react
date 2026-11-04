// api/keycloak.ts
// 
import {
  TTokenRequest,
  TAuthToken,
  TAuthConfig,
  TTokenRequestWithCodeAndVerifier,
} from "../configs/auth";
import keycloakConfig, { KeycloakConfig } from "../configs/keycloak";

export function keycloak_url(fun: string, config: KeycloakConfig = keycloakConfig) {
  return config.keycloak + "/protocol/openid-connect/" + fun;
}

export function redirectUri(page: string) {
  return window.location.origin + "/" + page;
}

function buildUrlEncodedRequest(request: TTokenRequest): string {
  let queryString = "";
  for (const [key, value] of Object.entries(request)) {
    queryString += `${queryString ? "&" : ""}${key}=${encodeURIComponent(value)}`;
  }
  return queryString;
}

export class FetchError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.statusText = statusText;
  }
}

async function postWithXForm(
  url: string,
  request: TTokenRequest,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    body: buildUrlEncodedRequest(request),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).then(async (response: Response) => {
    if (!response.ok) {
      const responseBody = await response.text();
      throw new FetchError(response.status, response.statusText, responseBody);
    }
    return response;
  });
}

function isTokenResponse(body: unknown | TAuthToken): body is TAuthToken {
  return (body as TAuthToken).access_token !== undefined;
}

function postTokenRequest(
  tokenEndpoint: string,
  tokenRequest: TTokenRequest,
): Promise<TAuthToken> {
  return postWithXForm(tokenEndpoint, tokenRequest).then((response) => {
    return response.json().then((body: TAuthToken | unknown): TAuthToken => {
      if (isTokenResponse(body)) {
        return body;
      }
      throw Error(JSON.stringify(body));
    });
  });
}

export const fetchTokens = (
  config: TAuthConfig,
  code: string,
  code_verifier: string,
  redirectPage: string,
): Promise<TAuthToken> => {
  const tokenRequest: TTokenRequestWithCodeAndVerifier = {
    grant_type: "authorization_code",
    code: code,
    client_id: config.clientId,
    redirect_uri: redirectUri(redirectPage),
    code_verifier: code_verifier,
  };
  console.debug("postTokenRequest:" + config.tokenEndpoint);
  console.debug(tokenRequest);
  return postTokenRequest(config.tokenEndpoint, tokenRequest);
};
