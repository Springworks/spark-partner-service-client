## Install

```
npm i -S @springworks/spark-oidc-client
```
or
```
yarn add @springworks/spark-oidc-client
```

## API Reference
* [Introduction](#introduction)
* [Service Provider options](#oidc-client-options )
* [SessionManager](#session-manager)
* [How to use sdk](#spark-oidc-client)
* [How to test a client](#test-with-spark-oidc-client)


## Introduction

This is a wrapper of an existed [openid-client](https://www.npmjs.com/package/openid-client) sdk, which prefills some our `Service Provider Gateway`'s parameters.
It is also do some boilerplate checks and provide with useful method for a getting current subject and `Service Provider Gateway` Authorization header.

### Service Provider options

To be able to use our [OpenID Connect](https://openid.net/connect/) interpretation, the user needs to specify client options:
```typescript
interface OidcClientOptions {
  client_id: string;
  client_secret: string;
  callback_url: string;
}
```

where `client_id` and `client_secret` should be provider by `Service Provider Gateway` and `callback_url` is an url, to which the response with Authorization Code will be sent.

### SessionManager

`spark-oidc-client` provides some intermediate OAuth 2.0 flow checks (`state` parameter) and store some useful data (current `subject` and `access_token`) to reduce code's copy-pastes.
Thus, the user needs to implement the `SessionManager` interface:

```typescript
interface SessionManager {
  storeInSession(key: string, value: string): Promise<void>;
  getFromSession(key: string): Promise<string>;
}
```

Here is an example of `SessionManager` using [hapi framework](https://hapijs.com/).

```typescript
const SDK_SESSION_COOKIE_NAME = 'sdk_session';
class HapiSessionManager implements SessionManager {
  constructor(private request: Request, private h: ResponseToolkit) {}

  public async getFromSession(key: string): Promise<string> {
    const sdk_session = this.request.state[SDK_SESSION_COOKIE_NAME] || {};
    return sdk_session[key];
  }

  public async storeInSession(key: string, value: string): Promise<void> {
    const sdk_session = this.request.state[SDK_SESSION_COOKIE_NAME] || {};
    sdk_session[key] = value;
    this.h.state('sdk_session', sdk_session);
  }
}
```

`spark-oidc-client` is storing already encrypted values by modified `client_secret`, but we recommend you to encrypt your session cookies by more secure key.

### How to use sdk

To use `spark-oidc-client` sdk you need to create an instance of `SparkOidcClient` class with predefined [OidcClientOptions](#oidc_client_options):
```typescript
class SparkOidcClient {
  constructor(options: OidcClientOptions);
  authorizationCallback(request_query_params: { [key: string]: string | string[] }, session_manager: SessionManager): Promise<{ subject: string; access_token: string }>;
  authorizationHeader(session_manager: SessionManager): Promise<string>;
  authorizationUrl(state: string, session_manager: SessionManager): Promise<string>;
  currentSubject(session_manager: SessionManager): Promise<string | null>;
```

To check if current session is authenticated, you can call `client.currentSubject(session_manager)` or `client.authorizationHeader(session_manager)`.
If there is some value, the current session is authenticated, if not - you should start authorization by redirecting to `Service Provider Gateway`'s authorization url
(calling `client.authorizationUrl(state, session_manager)`, where [`state`](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest) is a random unique value).
You also need to implement a `callback endpoint`, which is the same as in [OidcClientOptions](#oidc_client_options) to receive a server response. 
In a callback endpoint you should call `client.authorizationCallback(request_query_params, session_manager)`, where `request_query_params` is a current request query parameters. 
As a result, you should have an authenticated session.

For more examples see [test-client.ts](./test/test-client.ts).

### How to test a client

To test a your service with our sdk, you can start your own [oidc-provider](https://www.npmjs.com/package/oidc-provider) and create `SparkOidcClient` with a `IssuerConfig` parameter:

```typescript
interface IssuerConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  id_token_signed_response_alg?: string;
}
class SparkOidcClient {
  constructor(options: OidcClientOptions, issuer_config: IssuerConfig);
}
```

For more details, see [test-provider.ts](./test/test-provider.ts).
