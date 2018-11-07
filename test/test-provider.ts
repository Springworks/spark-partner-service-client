import Router = require('koa-router');
import OIDCProvider = require('oidc-provider');
import { SparkOidcIssuerConfig, SparkPartnerServiceClientOptions } from '../src';
import { TOKEN_ENDPOINT_AUTH_METHOD } from '../src/consts';

export class TestOidcProvider {
  private oidc_server: any;
  private base_url: string;
  constructor(private port: number) {
    this.base_url = `http://localhost:${this.port}`;
  }

  public async start(client_options: SparkPartnerServiceClientOptions) {
    const oidc = new OIDCProvider(this.base_url);
    const router = new Router();
    router.use(async (ctx: Router.IRouterContext, next: () => Promise<any>) => {
      try {
        return await next();
      } catch (err) {
        if (err instanceof OIDCProvider.SessionNotFound) {
          ctx.status = err.status;
          throw err;
        } else {
          throw err;
        }
      }
    });

    router.get('/interaction/:grant', async (ctx: Router.IRouterContext, next: () => Promise<any>) => {
      const details = await oidc.interactionDetails(ctx.req);

      if (details.interaction.error === 'login_required') {
        const results = {
          login: {
            account: '7ff1d19a-d3fd-4863-978e-8cce75fa880c', // logged-in account id
            remember: true,
          },
        };

        return oidc.interactionFinished(ctx.req, ctx.res, results);
      }

      return next();
    });

    oidc.use(router.routes());
    const clients = [
      {
        client_id: client_options.client_id,
        client_secret: client_options.client_secret,
        token_endpoint_auth_method: TOKEN_ENDPOINT_AUTH_METHOD,
        redirect_uris: [client_options.callback_url],
      },
    ];
    await oidc.initialize({ clients });
    this.oidc_server = oidc.listen(this.port);
  }

  public async stop() {
    this.oidc_server.close();
  }

  public getIssuerConfig(): SparkOidcIssuerConfig {
    return {
      issuer: this.base_url,
      authorization_endpoint: `${this.base_url}/auth`,
      token_endpoint: `${this.base_url}/token`,
      jwks_uri: `${this.base_url}/certs`,
      id_token_signed_response_alg: 'RS256',
    };
  }
}
