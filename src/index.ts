import { Sha256 } from '@aws-crypto/sha256-js';
import {
    NODE_REGION_CONFIG_FILE_OPTIONS,
    NODE_REGION_CONFIG_OPTIONS,
} from '@aws-sdk/config-resolver';
import { defaultProvider as defaultCredentialProvider } from '@aws-sdk/credential-provider-node';
import { loadConfig } from '@aws-sdk/node-config-provider';
import { HttpRequest as AwsHttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import type { CredentialProvider, Credentials, Provider } from '@aws-sdk/types';
import { parseUrl } from '@aws-sdk/url-parser';
import fetch, { Request } from 'cross-fetch';

type SignArguments = {
    readonly service: string;
    readonly regionProvider: Provider<string>;
    readonly credentialProvider: CredentialProvider;
    readonly date?: Date;
};

const getCredentialProvider = (credentials?: Credentials) =>
    credentials
        ? () => Promise.resolve(credentials)
        : defaultCredentialProvider();

const getRegionProvider = (region?: string) =>
    region
        ? () => Promise.resolve(region)
        : loadConfig(
              NODE_REGION_CONFIG_OPTIONS,
              NODE_REGION_CONFIG_FILE_OPTIONS
          );

const transformHeaders = (request: Request) => {
    const newHeaders: AwsHttpRequest['headers'] = {};
    const excludeHeaders = new Set(['host', 'content-type']);
    request.headers.forEach((value, key) => {
        if (excludeHeaders.has(key)) return;
        newHeaders[key] = value;
    });
    newHeaders['content-type'] = 'application/json';
    newHeaders.host = new URL(request.url).host;
    return newHeaders;
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
    signArgs: SignArguments
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
    signArgs: SignArguments
): Promise<Request> => {
    const signedHeaders = await getSignedHeaders(request, signArgs);
    const signedRequest = new Request(request.url, {
        method: request.method,
        body: request.body,
        headers: signedHeaders,
    });
    return signedRequest;
};

type SignedFetch = (
    input: RequestInfo,
    init?: RequestInit
) => Promise<Response>;

export const createSignedFetch = (options: {
    readonly service: string;
    readonly awsCredentials?: Credentials;
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
