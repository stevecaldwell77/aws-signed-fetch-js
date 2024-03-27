# @scaldwell77/aws-signed-fetch

An implementation of fetch that adds AWS signature headers to the request.

## Installation

```
npm install @scaldwell77/aws-signed-fetch
```

## Usage

```ts
import { createSignedFetch } from '@scaldwell77/aws-signed-fetch';

// Create a fetch that can call IAM-protected API Gateway endpoints.
const fetch = createSignedFetch({
    service: 'execute-api',
});

// ...
```

## Configuration

By default, the library uses the credentials and region specified in the global
`AWS.config` object. You can override these settings via the `awsCredentials`
and `awsRegion` options:

```ts
import { createSignedFetch } from '@scaldwell77/aws-signed-fetch';

const fetch = createSignedFetch({
    service: 'execute-api',
    awsCredentials: {
        /* spell-checker: disable */
        accessKeyId: 'asdfasdfd',
        secretAccessKey: 'asdfasdfd',
        sessionToken: 'asdfasdf',
        /* spell-checker: enable */
    },
    awsRegion: 'us-east-1',
});
```

## Testing

See [HowTo: Live test of createSignedFetch()](./test-stack/README.md).
