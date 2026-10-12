# NOTICE

This project ("asAi Chat") is a modified fork of the Oriveo web client.

## Upstream

| Field | Value |
|---|---|
| Project | Oriveo |
| Repository | https://github.com/oriveo/oriveo |
| License | GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later) |
| Pinned commit | `e6c481e3169956ab8d9a9742cfd684905c382d07` |
| Commit date | 2026-10-12 12:05:41 +0800 |
| Commit subject | `fix(ios): let the back swipe start anywhere on iOS 26 and later` |
| Upstream `LICENSE` SHA-256 | `d65a8dce873d9f463df3b1292681f0d3836fd0ceaa763f22aeda7c36df50e01e` |

The full upstream license text is preserved verbatim in `LICENSE` at the root of this
repository and is not modified.

## Our modifications

This repository is derived from the `web/` component of the upstream monorepo. The
following upstream paths are **not** carried into this project and are not part of the
deployed revision:

- `ios/` — native iOS client (out of scope; this project is a web application)
- `android/` — native Android client (out of scope)
- `macos/` — native macOS client (out of scope)
- `docs/` — upstream cross-platform documentation (not applicable)
- `readme_i18n/` — upstream translated READMEs (not applicable)

The `shared/` directory is retained because the web application's test suite consumes
model-contract and MCP fixtures from it (see `web/apps/app/**/__tests__`).

All original upstream source files in `web/` and `shared/` are retained under their
original license terms. Modifications made by us are limited to the changes recorded in
this project's git history and summarised in the project tracker:

- Branding (asAi name, logo, colour palette, typography)
- Removal of all non-asAi provider surfaces and relay/subscription flows
- Hardening of the asAi provider preset
- Documentation and customer-facing copy

## Source availability (AGPL-3.0 §13)

Because this software is offered to users over a network, the complete corresponding
source code of the running revision is made available. The About/Settings page of the
deployed application links to the exact published source tree for the running revision.

Source publication location: _to be recorded at gate G2 (see project tracker)._ The
public repository URL and the deployed revision's commit SHA are linked from the
application's About page.

## No warranty

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the `LICENSE` file for more details.
