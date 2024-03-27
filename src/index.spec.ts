import test from 'ava';
import { Request } from 'cross-fetch';

import { createSignedFetch, signRequest } from './index.js';

test('signRequest()', async (t) => {
    const host =
        'gfaichcrsslcpgcnxgaryagfpw.appsync-api.us-east-1.amazonaws.com'; // spell-checker: disable-line
    const url = `https://${host}/graphql`;
    const method = 'POST';
    const headers = {
        'Content-Type': 'application/json',
        'X-My-Test': 'foobar',
    };
    const date = new Date(2022, 2, 24, 9, 33, 44);

    const query = /* GraphQL */ `
        query getUser($userId: String!) {
            user(userId: $userId) {
                userId
                userName
            }
        }
    `;
    const variables = { userId: '12345' };
    const body = JSON.stringify({ query, variables });
    const region = 'us-east-1';
    const credentials = {
        /* spell-checker: disable */
        accessKeyId: 'QEBOPDUODEDEDPCRVHWU',
        secretAccessKey: 'LDdxaf5TTG350BREOYzkQd26QrqPoZPAzMNKDHjY',
        sessionToken:
            'TJYF2ZZQuWdQeCk//////////uByMGIjLpaJ2enPSGPXUD75ULwIO5WeCeYeLGMoiI6vTQNxXwQAldvorrBFeiJmhkHbJ59muzdrWqe1hi5cVQF24bTrwdjEn8vfWfCrdA30f1FMmlff51sptmStqlWXraJEEI1JTtjqqPf2NcLVYSH1fXqMc1QjeOg0YgFtcuVqQiuQ1HwbuYKFFXWaRr7TxsVmiqv5isOuknEq9h3le009jEGB3A4ivMMZyYaIRwhSPH5JGMvg7Ldc9kZCYVAKMkTcI0CG1Fh9wMnRv0mQovaDCckVvXM2aDVFPaQeDYQ3NMIj36mpOOiXEr1HjqCwKCCgPOGnx3ZZbfqtKfkBdzdzhSJS',
        /* spell-checker: enable */
    };

    const request = new Request(url, {
        method,
        headers,
        body,
    });

    const signedRequest = await signRequest(request, {
        service: 'appsync',
        regionProvider: async () => region,
        credentialProvider: async () => credentials,
        date,
    });

    t.is(
        signedRequest.headers.get('content-type'),
        'application/json',
        'Content-Type header set',
    );
    t.is(signedRequest.headers.get('host'), host, 'Host header set');
    t.is(
        signedRequest.headers.get('x-my-test'),
        'foobar',
        'custom header preserved',
    );
    t.is(
        signedRequest.headers.get('x-amz-security-token'),
        credentials.sessionToken,
        'x-amz-security-token header added',
    );
    t.is(
        signedRequest.headers.get('x-amz-date'),
        '20220324T163344Z',
        'x-amz-date header added',
    );
    t.is(
        signedRequest.headers.get('authorization'),
        'AWS4-HMAC-SHA256 Credential=QEBOPDUODEDEDPCRVHWU/20220324/us-east-1/appsync/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token;x-my-test, Signature=50409102c1bdff80eb31eb26a0944be4bfcb0afbdd8a6378e4d504117d6adbc8', // spell-checker: disable-line
        'authorization header added',
    );

    t.pass();
});

test('request to lambda URL', async (t) => {
    const lambdaUrl = process.env.SIGNED_FETCH_TEST_LAMBDA_URL;
    if (!lambdaUrl) {
        t.log(
            'No SIGNED_FETCH_TEST_LAMBDA_URL environment variable set, skipping test',
        );
        t.pass();
        return;
    }

    const signedFetch = createSignedFetch({
        service: 'lambda',
    });

    const response1 = await fetch(lambdaUrl);
    t.is(response1.status, 403, 'using regular fetch results in a 403 error');

    const response2 = await signedFetch(lambdaUrl);

    t.is(response2.status, 200, 'using signed fetch, response status is 200');

    const body = await response2.json();
    t.deepEqual(
        body,
        { message: 'Hello, World!' },
        'response body matches expected',
    );
});
