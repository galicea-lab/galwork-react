export type KeycloakConfig = {
  keycloak : string,
  keycloak_client : string,
};

let keycloakConfig: KeycloakConfig =
{
  keycloak : 'https://login.e-talar.com/realms/lab',
  keycloak_client : 'lab',
};

export default keycloakConfig
