declare module 'oidc-provider';

declare module 'get-port' {
  let getPort: (options?: { port?: number | ReadonlyArray<number>; host?: string }) => Promise<number>;
  export = getPort;
}

declare module 'openid-client' {
  export interface HttpOptions {
    // TODO: This is the options object from the `got` package.
    [key: string]: any;
  }

  export interface ClientOptions {
    client_id: string;
    client_secret: string;
    application_type?: string;
    grant_types?: ReadonlyArray<string>;
    id_token_signed_response_alg?: string;
    redirect_uris?: ReadonlyArray<string>;
    response_types?: ReadonlyArray<string>;
    token_endpoint_auth_method?: string;
    token_endpoint_auth_signing_alg?: string;
  }

  export interface Client {
    readonly issuer: Issuer;
    CLOCK_TOLERANCE: number;

    // TODO: add types for these `any`
    authorizationUrl(params: any): any;
    authorizationPost(params: any): any;
    callbackParams(input: any): any;
    authorizationCallback(redirectUri: any, parameters: any, checks?: any): any;
    oauthCallback(redirectUri: any, parameters: any, checks?: any): any;
    refresh(refreshToken: string): Promise<TokenSet>;
    userinfo(accessToken: string, options: any): any;
    grant(body: any): Promise<TokenSet>;
    revoke(token: string, hint?: string): Promise<any>;
    introspect(token: string, hint?: string): Promise<any>;
    fetchDistributedClaims(claims: any, tokens?: any): Promise<any>;
    unpackAggregatedClaims(claims: any): Promise<any>;
    inspect(): string;
    requestObject(request: any, algorithms: { sign: string; encrypt: { alg: string; enc: string } }): Promise<any>;
  }

  export interface ClientConstructor {
    readonly issuer: Issuer;

    // TODO: add types for these `any`

    new (metadata: ClientOptions, keystore?: any): Client;

    register(properties: any, options?: { initialAccessToken?: string; keystore?: any }): Promise<Client>;
    fromUri(uri: string, token: string, keystore: any): Promise<Client>;
  }

  export interface IssuerOptions {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint?: string;
    jwks_uri?: string;
    claim_types_supported?: ReadonlyArray<string>;
    claims_parameter_supported?: boolean;
    grant_types_supported?: ReadonlyArray<string>;
    request_parameter_supported?: boolean;
    request_uri_parameter_supported?: boolean;
    require_request_uri_registration?: boolean;
    response_modes_supported?: ReadonlyArray<string>;
    token_endpoint_auth_methods_supported?: ReadonlyArray<string>;
    token_endpoint_auth_signing_alg_values_supported?: ReadonlyArray<string>;
  }

  export class Issuer {
    constructor(options: IssuerOptions);

    static discover(uri: string): Promise<Issuer>;

    static webfinger(input: string): Promise<Issuer>;

    static defaultHttpOptions: HttpOptions;

    inspect(): string;

    httpOptions(options: Partial<HttpOptions>): HttpOptions;
    static httpOptions(options: Partial<HttpOptions>): HttpOptions;

    readonly metadata: { [key: string]: any };

    readonly Client: ClientConstructor;
  }

  export const Registry: Map<string, Issuer>;

  export interface StrategyOptions {
    client: Client;
    params?: any;
    passReqToCallback?: boolean;
    sessionKey: string;
    usePKCE?: boolean;
  }

  export type StrategyVerifyFunction = () => any;

  export class Strategy {
    constructor(options: StrategyOptions, verify: StrategyVerifyFunction);
    authenticate(req: any, options?: any): void;
    name: string;
  }

  export class TokenSet {
    constructor(values: { [key: string]: any });
    expires_in: number;
    expired(): boolean;
    readonly claims: { [key: string]: any };
  }
}
