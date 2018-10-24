export const GATEWAY_BASE_URL = 'https://service-provider-gateway.machinetohuman.com/';

export const GATEWAY_CONFIG = {
  issuer: GATEWAY_BASE_URL,
  authorization_endpoint: `${GATEWAY_BASE_URL}v1/oauth/authorize`,
  token_endpoint: `${GATEWAY_BASE_URL}v1/oauth/token`,
};

export const AUTHORIZATION_SCOPE = 'openid';
export const TOKEN_ENDPOINT_AUTH_METHOD = 'client_secret_jwt';
export const TOKEN_ENDPOINT_AUTH_SIGNING_ALG = 'HS256';

export const ID_TOKEN_AUTH_SIGNED_ALG = 'HS256';
export const STATE_SESSION_KEY = 'spk_stt';

export const CREDENTIALS_SESSION_KEY = 'spk_crd';
