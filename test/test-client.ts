import { randomBytes } from 'crypto';
import { Request, RequestQuery, ResponseToolkit, Server } from 'hapi';
import { SparkOidcIssuerConfig, SparkPartnerServiceClientOptions, SessionManager, SparkPartnerServiceClient } from '../src';

class TestSessionManager implements SessionManager {
  constructor(private request: Request, private h: ResponseToolkit) {}

  public async getFromSession(key: string): Promise<string> {
    const sdk_session = this.request.state.sdk_session || {};
    return sdk_session[key];
  }

  public async storeInSession(key: string, value: string): Promise<void> {
    const sdk_session = this.request.state.sdk_session || {};
    sdk_session[key] = value;
    this.h.state('sdk_session', sdk_session);
  }
}

/* tslint:disable:max-classes-per-file  */
export class TestClient {
  private server: Server;
  private oidc_client?: SparkPartnerServiceClient;
  private oidc_client_options?: SparkPartnerServiceClientOptions;

  constructor() {
    this.server = new Server({ host: '0.0.0.0', port: 0 });
    this.server.state('sdk_session', {
      path: '/',
      isSecure: false,
      encoding: 'iron',
      password: 'must-be-at-least-32-characters-long',
    });
    this.server.route([
      {
        method: 'GET',
        path: '/',
        options: {
          handler: async (req, h) => {
            const redirect_url = await this.oidc_client!.authorizationUrl(
              randomBytes(24).toString('hex'),
              new TestSessionManager(req, h),
            );
            return h.redirect(redirect_url);
          },
        },
      },
      {
        method: 'GET',
        path: '/callback',
        options: {
          handler: async (req, h) => {
            return this.oidc_client!.authorizationCallback(req.query as RequestQuery, new TestSessionManager(req, h));
          },
        },
      },
      {
        method: 'GET',
        path: '/subject',
        options: {
          handler: async (req, h) => {
            return this.oidc_client!.currentSubject(new TestSessionManager(req, h));
          },
        },
      },
      {
        method: 'GET',
        path: '/auth_header',
        options: {
          handler: async (req, h) => {
            return this.oidc_client!.authorizationHeader(new TestSessionManager(req, h));
          },
        },
      },
    ]);
  }

  public async start(issuer_config: SparkOidcIssuerConfig) {
    await this.server.start();
    this.oidc_client = new SparkPartnerServiceClient(this.getOidcClientOptions(), issuer_config);
  }

  public async stop() {
    await this.server.stop();
  }

  public getOidcClientOptions() {
    if (!this.oidc_client_options) {
      this.oidc_client_options = {
        client_id: randomBytes(12).toString('hex'),
        client_secret: randomBytes(24).toString('hex'),
        callback_url: `${this.getBaseUrl()}/callback`,
      };
    }

    return this.oidc_client_options;
  }

  public getBaseUrl() {
    return `http://localhost:${this.server.info.port}`;
  }

  public getSubjectUrl() {
    return `${this.getBaseUrl()}/subject`;
  }

  public getAuthHeaderUrl() {
    return `${this.getBaseUrl()}/auth_header`;
  }
}
