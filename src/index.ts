import { Sha256 } from '@aws-crypto/sha256-js';
import {
    NODE_REGION_CONFIG_FILE_OPTIONS,
    NODE_REGION_CONFIG_OPTIONS,
} from '@smithy/config-resolver';
import { defaultProvider as defaultCredentialProvider } from '@aws-sdk/credential-provider-node';
import { loadConfig } from '@smithy/node-config-provider';
import { HttpRequest as AwsHttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import type {
    AwsCredentialIdentity,
    AwsCredentialIdentityProvider,
    Provider,
} from '@aws-sdk/types';

type SignArguments = {
    readonly service: string;
    readonly regionProvider: Provider<string>;
    readonly credentialProvider: AwsCredentialIdentityProvider;
    readonly date?: Date;
};

const getCredentialProvider = (credentials?: AwsCredentialIdentity) =>
    credentials
        ? () => Promise.resolve(credentials)
        : defaultCredentialProvider();

const getRegionProvider = (region?: string) =>
    region
        ? () => Promise.resolve(region)
        : loadConfig(
              NODE_REGION_CONFIG_OPTIONS,
              NODE_REGION_CONFIG_FILE_OPTIONS,
          );

const transformHeaders = (request: Request) => {
    const newHeaders: AwsHttpRequest['headers'] = {};
    const excludeHeaders = new Set(['host', 'content-type']);

    const { headers, url } = request;
    headers.forEach((value, key) => {
        if (excludeHeaders.has(key)) return;
        newHeaders[key] = value;
    });

    newHeaders['content-type'] = 'application/json';
    newHeaders.host = new URL(url).host;
    return newHeaders;
};

const parseUrlQuery = (url: URL) => {
    const params: Record<string, string | Array<string> | null> = {};

    const keys = [...url.searchParams.keys()];
    if (keys.length === 0) return;

    for (const key of keys) {
        const values = url.searchParams.getAll(key);

        if (values.length === 0) {
            params[key] = null;
        } else if (values.length === 1) {
            params[key] = values[0] as string;
        } else {
            params[key] = values;
        }
    }

    return params;
};

const parseUrl = (urlStr: string) => {
    const url = new URL(urlStr);
    return {
        hostname: url.hostname,
        port: url.port ? Number.parseInt(url.port, 10) : undefined,
        protocol: url.protocol,
        path: url.pathname,
        query: parseUrlQuery(url),
    };
};

const buildAwsRequest = (request: Request) =>
    new AwsHttpRequest({
        ...parseUrl(request.url),
        method: request.method,
        headers: transformHeaders(request),
        body: request.body,
    });

const signAwsRequest = async (
    request: AwsHttpRequest,
    signArgs: SignArguments,
) => {
    const [region, credentials] = await Promise.all([
        signArgs.regionProvider(),
        signArgs.credentialProvider(),
    ]);

    const signer = new SignatureV4({
        service: signArgs.service,
        region,
        sha256: Sha256,
        credentials,
    });
    const signedRequest = await signer.sign(request, {
        signingDate: signArgs.date,
    });
    return signedRequest;
};

const getSignedHeaders = async (request: Request, signArgs: SignArguments) => {
    const awsRequest = buildAwsRequest(request);
    const signedAwsRequest = await signAwsRequest(awsRequest, signArgs);
    return signedAwsRequest.headers;
};

export const signRequest = async (
    request: Request,
    signArgs: SignArguments,
): Promise<Request> => {
    const signedHeaders = await getSignedHeaders(request, signArgs);
    const signedRequest = new Request(request.url, {
        method: request.method,
        body: request.body,
        headers: signedHeaders,
        duplex: request.duplex,
    });
    return signedRequest;
};

type SignedFetch = typeof fetch;

export const createSignedFetch = (options: {
    readonly service: string;
    readonly awsCredentials?: AwsCredentialIdentity;
    readonly awsRegion?: string;
}): SignedFetch => {
    const credentialProvider = getCredentialProvider(options.awsCredentials);
    const regionProvider = getRegionProvider(options.awsRegion);
    const signedFetch: SignedFetch = async (input, init) => {
        const request = new Request(input, init);
        const signedRequest = await signRequest(request, {
            service: options.service,
            regionProvider,
            credentialProvider,
        });
        return fetch(signedRequest);
    };

    return signedFetch;
};
