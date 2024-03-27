# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.0.0](https://github.com/stevecaldwell77/aws-signed-fetch-js/compare/v2.0.1...v3.0.0) (2023-04-27)

### BREAKING CHANGES

-   Changed return type of createSignedFetch() to be a native `fetch`.
-   Dropped use of `cross-fetch`

## [2.0.1](https://github.com/stevecaldwell77/aws-signed-fetch-js/compare/v2.0.0...v2.0.1) (2023-04-27)

### Patches

-   Fixed missing "repository" in package.json

## [2.0.0](https://github.com/stevecaldwell77/aws-signed-fetch-js/compare/v1.1.0...v2.0.0) (2023-04-22)

### BREAKING CHANGES

-   This package is now ESM only
-   Minimum Node version is now 18

### Patches

-   Upgraded all AWS dependencies. Some of these were migrated out of the `@aws-sdk` namespace and into `@smithy`.

### Misc

Striped out a lot of development boilerplate to just keep this project simple.

### [1.1.1](https://github.com/stevecaldwell77/aws-signed-fetch-js/compare/v1.1.0...v1.1.1) (2023-02-05)

### Bug Fixes

-   handle query string params with spaces correctly ([07dfc1e](https://github.com/stevecaldwell77/aws-signed-fetch-js/commit/07dfc1e50b783c4c51bcc00542c0e7ba13c9e3f3))

## 1.1.0 (2022-09-13)

### Features

-   add createSignedFetch() ([a0ab81e](https://github.com/stevecaldwell77/aws-signed-fetch-js/commit/a0ab81e6c6478db1f4db38583114edc9ba6a1f64))
