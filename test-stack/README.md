# HowTo: Live test of createSignedFetch()

Background: our test located in src/index.spec.ts has a test that will make live calls to a lambda function if the `SIGNED_FETCH_TEST_LAMBDA_URL` environment variable is set. This is useful for testing the library against a real AWS service. However, it means you need to manually deploy a test stack to AWS to create the backing resource.

The below assumes you have AWS credentials loaded in your environment with admin permissions.

Deploy our test stack:

```sh
make -C test-stack deploy-stack
```

Test that the test lambda function works properly:

```sh
function_name=$(make -C test-stack get-function-name)
aws lambda invoke \
    --function-name $function_name \
    /dev/stdout
```

Get the IAM-protected URL for the lambda function:

```sh
function_url=$(make -C test-stack get-function-url)
```

Test that the URL works using the [awscurl](https://github.com/okigan/awscurl) tool to sign the request:

```sh
awscurl --service lambda $function_url
```

Run our test, triggering the live test by setting the `SIGNED_FETCH_TEST_LAMBDA_URL` environment variable:

```sh
pnpm run build
SIGNED_FETCH_TEST_LAMBDA_URL=$function_url pnpm run test
```

If everything looks good, you can clean up the test stack:

```sh
make -C test-stack destroy-stack
```
