# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 2.0.x (2.0.1 and later) | ✅ |
| < 2.0.1 | ❌ Deprecated on npm. Doc Tree URLs are not sanitised; upgrade to 2.0.1 or later. |

## Reporting a vulnerability

Please report security issues privately through GitHub:
[**Report a vulnerability**](https://github.com/jithinsk/markdown-to-richtext/security/advisories/new).

Don't open a public issue for a security problem. Include:

- the md-to-rich version and which function you called (`toHtml`, `toAnsi`, `toDocTree`, `serialize`)
- the Markdown input that triggers the problem
- what you expected and what you got

Fixes are released as patch versions and noted under **Security** in the [changelog](CHANGELOG.md).

## Scope

md-to-rich sanitises the URLs it emits and strips raw HTML by default. The [Security](https://md-to-rich.jithins.dev/docs/security) docs page describes exactly what is and isn't covered, including the `allowRawHtml` option, which passes raw HTML through unchanged.
