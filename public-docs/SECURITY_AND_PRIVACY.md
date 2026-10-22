# Security And Privacy Overview

LandingForge is designed with secure defaults and clear operational boundaries.

## Environment Safety

Secrets are managed through environment variables and should never be committed.

Examples:

- database URLs;
- authentication secrets;
- API keys;
- service role keys;
- cron secrets;
- email provider keys;
- monitoring tokens.

Use `.env.example` for public placeholders and `.env.local` for local private values.

## Authentication

The platform uses Auth.js for CMS authentication.

Authentication is designed around:

- secure password handling;
- signed sessions;
- protected CMS routes;
- role-aware access checks.

## Authorization

Role-based access control is used to limit CMS features by user responsibility.

Typical access levels include:

- super admin;
- client admin;
- viewer.

## Form Protection

Public forms are protected through:

- server-side validation;
- Zod schemas;
- honeypot fields;
- rate limiting;
- optional Cloudflare Turnstile verification;
- duplicate submission checks.

## Data Handling

Lead and form data should be treated as sensitive operational data.

The application includes patterns for:

- lead management;
- consent tracking;
- export workflows;
- personal data export;
- audit logging.

## Monitoring

Monitoring hooks support structured error reporting and sanitization so sensitive fields are not intentionally logged.

## Public Repository Rules

Do not publish:

- `.env.local`;
- internal planning documents;
- internal task notes;
- development workflow notes;
- private QA reports;
- raw client data;
- service credentials.

## Showcase Screenshots

Screenshots committed under `public/` are public static assets. Use synthetic records, inspect every image at full resolution and remove names, email addresses, account identifiers and private operational data. CMS/dashboard captures managed by the application remain private; repository screenshots need their own separate review and must not bypass portfolio visibility or consent rules.

