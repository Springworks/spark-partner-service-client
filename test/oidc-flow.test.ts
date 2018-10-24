import getPort = require('get-port');
import { Response } from 'request';
import request = require('request');
import { TestClient } from './test-client';
import { TestOidcProvider } from './test-provider';

async function makeRequest(params: any) {
  /* tslint:disable:no-inferred-empty-object-type  */
  return new Promise((resolve: any, reject: any) => {
    request(params, (err: any, res: Response) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
}

describe('OIDC flow test with SDK', () => {
  let provider: TestOidcProvider;
  let client: TestClient;

  beforeAll(async () => {
    client = new TestClient();
    provider = new TestOidcProvider(await getPort());

    await client.start(provider.getIssuerConfig());
    await provider.start(client.getOidcClientOptions());
  });

  afterAll(async () => {
    await client.stop();
    await provider.stop();
  });

  describe('when making auth request', () => {
    let result: any;
    beforeEach(async () => {
      result = await makeRequest({
        url: client.getBaseUrl(),
        method: 'GET',
        jar: request.jar(),
      });
    });

    it('should do success authentication and response with `subject` and `access_token`', async () => {
      expect(result.statusCode).toEqual(200);
      expect(JSON.parse(result.body)).toEqual({
        subject: expect.any(String),
        access_token: expect.any(String),
      });
    });

    describe('when making a /subject request', () => {
      it('should return a the same subject as in auth response', async () => {
        const result_user: any = await makeRequest({
          url: client.getSubjectUrl(),
          method: 'GET',
          headers: { cookie: result.headers['set-cookie'][0].split('; ')[0] },
          jar: request.jar(),
        });
        expect(result_user.statusCode).toEqual(200);
        expect(result_user.body).toEqual(JSON.parse(result.body).subject);
      });
    });

    describe('when making an /auth_header request', () => {
      it('should return a correct Authorization header', async () => {
        const result_user: any = await makeRequest({
          url: client.getAuthHeaderUrl(),
          method: 'GET',
          headers: { cookie: result.headers['set-cookie'][0].split('; ')[0] },
          jar: request.jar(),
        });
        expect(result_user.statusCode).toEqual(200);
        expect(result_user.body).toEqual(`Bearer ${JSON.parse(result.body).access_token}`);
      });
    });
  });
});
