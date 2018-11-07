import { createHash } from 'crypto';
import { defaults as iron_defaults, seal, unseal } from 'iron';
import { Client, Issuer } from 'openid-client';
import {
  AUTHORIZATION_SCOPE,
  CREDENTIALS_SESSION_KEY,
  GATEWAY_CONFIG,
  ID_TOKEN_AUTH_SIGNED_ALG,
  STATE_SESSION_KEY,
  TOKEN_ENDPOINT_AUTH_METHOD,
  TOKEN_ENDPOINT_AUTH_SIGNING_ALG,
} from './consts';

export interface SparkPartnerServiceClientOptions {
  client_id: string;
  client_secret: string;
  callback_url: string;
}

export interface SessionManager {
  getFromSession(key: string): Promise<string>;

  storeInSession(key: string, value: string): Promise<void>;
}

export interface SparkOidcIssuerConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  id_token_signed_response_alg?: 'HS256' | 'RS256';
}

export class SparkPartnerServiceClient {
  private backing_oidc_client: Client;
  private encryption_key: string;

  constructor(private options: SparkPartnerServiceClientOptions, issuer_config: SparkOidcIssuerConfig = GATEWAY_CONFIG) {
    this.backing_oidc_client = this.createBackingClient(options, issuer_config);
    this.encryption_key = createHash('sha512')
      .update(options.client_secret, 'utf8')
      .digest('hex');
  }

  public async authorizationCallback(
    query_params: { [key: string]: string | string[] },
    session_manager: SessionManager,
  ): Promise<{ subject: string; access_token: string }> {
    if (!this.validateSessionManager(session_manager)) {
      throw new Error('SessionManager is expected.');
    }

    const encrypted_state = await session_manager.getFromSession(STATE_SESSION_KEY);
    if (typeof encrypted_state !== 'string') {
      throw new Error('state parameter is not in a session.');
    }

    const state = await this.decryptData(encrypted_state);

    const auth_credentials = await this.backing_oidc_client.authorizationCallback(this.options.callback_url, query_params, {
      state,
    });
    const subject = auth_credentials.claims.sub;
    const access_token = auth_credentials.access_token;

    await session_manager.storeInSession(CREDENTIALS_SESSION_KEY, await this.encryptData({ subject, access_token }));

    return {
      subject,
      access_token,
    };
  }

  public async authorizationHeader(session_manager: SessionManager): Promise<string> {
    if (!this.validateSessionManager(session_manager)) {
      throw new Error('SessionManager is expected.');
    }
    const credentials = await session_manager.getFromSession(CREDENTIALS_SESSION_KEY);

    if (!credentials) {
      return '';
    }

    const { access_token } = await this.decryptData(credentials);
    return access_token ? `Bearer ${access_token}` : '';
  }

  public async authorizationUrl(state: string, session_manager: SessionManager): Promise<string> {
    if (typeof state !== 'string') {
      throw new Error('Invalid state parameter.');
    }

    if (!this.validateSessionManager(session_manager)) {
      throw new Error('SessionManager is expected.');
    }

    await session_manager.storeInSession(STATE_SESSION_KEY, await this.encryptData(state));
    const url = await this.backing_oidc_client.authorizationUrl({
      redirect_uri: this.options.callback_url,
      scope: AUTHORIZATION_SCOPE,
      state,
    });
    return url.toString();
  }

  public async currentSubject(session_manager: SessionManager): Promise<string | null> {
    if (!this.validateSessionManager(session_manager)) {
      throw new Error('SessionManager is expected.');
    }
    const credentials = await session_manager.getFromSession(CREDENTIALS_SESSION_KEY);

    if (!credentials) {
      return null;
    }

    const { subject } = await this.decryptData(credentials);
    return subject || null;
  }

  private createBackingClient(
    { client_id, client_secret }: { client_id: string; client_secret: string },
    issuer_config: SparkOidcIssuerConfig,
  ) {
    const issuer = new Issuer({
      issuer: issuer_config.issuer,
      authorization_endpoint: issuer_config.authorization_endpoint,
      token_endpoint: issuer_config.token_endpoint,
      token_endpoint_auth_signing_alg_values_supported: [TOKEN_ENDPOINT_AUTH_SIGNING_ALG],
      jwks_uri: issuer_config.jwks_uri,
    });

    return new issuer.Client({
      client_id,
      client_secret,
      token_endpoint_auth_method: TOKEN_ENDPOINT_AUTH_METHOD,
      token_endpoint_auth_signing_alg: TOKEN_ENDPOINT_AUTH_SIGNING_ALG,
      id_token_signed_response_alg: issuer_config.id_token_signed_response_alg || ID_TOKEN_AUTH_SIGNED_ALG,
    });
  }

  private validateSessionManager(session_manager: any) {
    return (
      session_manager &&
      typeof session_manager.getFromSession === 'function' &&
      typeof session_manager.storeInSession === 'function'
    );
  }

  private async encryptData(data: any): Promise<string> {
    return seal(data, this.encryption_key, iron_defaults);
  }

  private async decryptData(encrypted: string): Promise<any> {
    try {
      return unseal(encrypted, this.encryption_key, iron_defaults);
    } catch (err) {
      throw new Error(`Cannot decrypt data: ${err.message}`);
    }
  }
}
