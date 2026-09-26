# Hanson Home production deployment

Public website: https://hansonhome.us

- Source repository: awesome7749/hanson; frontend: my-app; backend: server.
- Google Cloud project: hanson-hvac; region: us-east1; Cloud Run service: hanson-app.
- Deployment account: gaohan1990@gmail.com. Pass this account and project explicitly; do not change the machine's default Google Cloud account.
- The existing domain mapping, database, service account, Cloud SQL attachment and runtime environment are retained. Do not copy credentials from environment files into source or browser builds.
- Root Dockerfile builds the live frontend and backend together. It sets REACT_APP_DEPLOYMENT_MODE=live, disables source maps and prepares public robots/sitemap files. Default local and Sites builds remain previews.
- The build archive excludes environment files, app.yaml, node_modules, old build output, upload/results directories and Sites configuration.

## Validation

Run `npm run build --prefix server`, then `node --test server/tests/*.test.cjs`.
Run `CI=true npm test --prefix my-app -- --watchAll=false --runInBand` with no deployment mode override.
Build the public frontend with REACT_APP_DEPLOYMENT_MODE=live and GENERATE_SOURCEMAP=false, then run my-app/scripts/prepare-live.cjs with the same deployment mode.

Create the container in Cloud Build, deploy a tagged revision using --no-traffic, then verify HTTP routes, image assets, basic submissions, retry behavior and authenticated staff readback before assigning traffic.

## Intake operations

Staff sign-in: https://hansonhome.us/admin using the existing staff password. New requests are saved in the existing Lead table. Assessment requests have their own status and appear in the same inbox. Staff can review the homeowner's full answers and contact preferences and update status/internal notes.

New consented heat-pump and assessment requests are forwarded to Ventrix. Hanson does not directly send automatic email/SMS. Staff follow-up is manual. Photo uploads, a customer project account, live scheduling and automated quotes remain deferred. A preferred date is not a confirmed appointment.

## Rollback

The previous production revision before this launch is `hanson-app-00005-qrn`.

To restore it without touching customer records:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-00005-qrn=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

Do not delete older revisions or change the database when rolling back. The first basic-intake launch required no migration. Ventrix integration adds PartnerDelivery; it is safe to retain this table when rolling back.

## Ventrix deployment

Apply `server/prisma/sql/20260914-partner-delivery.sql` once through an authenticated database connection before deploying the partner-enabled backend. It only adds a table; it does not modify existing leads. This repository’s original database was not created with Prisma migration history, so use this reviewed additive SQL rather than a schema reset or automatic migration baseline.

Cloud Run configuration: `--update-secrets=VENTRIX_API_KEY=ventrix-partner-api-key:1 --update-env-vars=VENTRIX_SUBMISSIONS_ENABLED=true`. Preserve every existing runtime setting. Roll back this integration to `hanson-app-revamp-20260913` if needed; retain the delivery table and records. Failed/uncertain sends need staff attention in `/admin`; no background resend job runs.

The heat-pump routing expansion retains the same secret, database schema and API endpoint. Its immediate rollback revision is `hanson-app-ventrix-20260914`; that revision only forwards assessments.

## Facebook-ads landing deployment (September 22, 2026)

Revision `hanson-app-fbads-20260922` (image `gcr.io/hanson-hvac/hanson-app:fbads-20260922`)
carries the contact-first intake, partial leads (`POST /api/requests/partial`),
Meta Pixel with UTM capture, the `/start/thank-you` conversion page, the
Google-reviews endpoint and the chat widget. No database migration was needed;
partial leads reuse the Lead table with `status=partial`. Deployment accounts
now also include `jason.j@hansonhome.us` (granted Editor).

Its rollback revision is `hanson-app-ventrix-refresh-20260914`:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-ventrix-refresh-20260914=100 --region=us-east1 --project=hanson-hvac

Optional env vars activate follow-up plumbing when set (see DEPLOYMENT.md):
SMTP_* / LEAD_NOTIFY_* for partial-lead and chat emails, META_CAPI_TOKEN for
the Conversions API, GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID for the reviews
section.
