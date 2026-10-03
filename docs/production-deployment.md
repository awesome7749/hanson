# Hanson Home production deployment

Public website: https://hansonhome.us
Staff dashboard: https://ops.hansonhome.us/

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

Staff sign-in: https://ops.hansonhome.us/ using the existing staff password. New requests are saved in the existing Lead table. Assessment requests have their own status and appear in the same inbox. Staff can review the homeowner's full answers and contact preferences and update status/internal notes.

Admin security: the shared `ADMIN_PASSWORD` must be a strong value kept in server-side configuration and rotated if it may have been shared outside staff. The staff dashboard and staff API are served only on the ops hostname; `/admin` and staff API paths return 404 on the public hostname. The ops hostname is still publicly guessable, so its password and API authorization remain the security boundary. Password attempts are limited per Cloud Run instance; put a shared edge rate limit in front of `/api/admin/login` if brute-force traffic persists across instances.

The `ops.hansonhome.us` Cloud Run domain mapping points to `hanson-app` in `us-east1`. At Namecheap, add a CNAME host `ops` with value `ghs.googlehosted.com` (the exact record returned by `gcloud beta run domain-mappings describe --domain=ops.hansonhome.us --region=us-east1 --project=hanson-hvac`). Wait for `Ready=True` and a valid HTTPS response on the ops hostname before shifting traffic to a revision that removes the old `/admin` route. The same Cloud Run service serves both hostnames and selects the staff interface from the request hostname.

The ops revision `hanson-app-ops-20260926c` is staged at 0% traffic from image `gcr.io/hanson-hvac/hanson-app:ops-20260926c`. The staff HTML shell is stored outside the public static directory. Once HTTPS is ready, direct traffic to this revision and check the ops sign-in, public intake, and public 404 behavior. The immediate rollback revision is `hanson-app-calculator-20260926`:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-ops-20260926c=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com
    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-calculator-20260926=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

New consented heat-pump and assessment requests are forwarded to Ventrix. Hanson does not directly send automatic email/SMS. Staff follow-up is manual. Photo uploads, a customer project account, live scheduling and automated quotes remain deferred. A preferred date is not a confirmed appointment.

## Rollback

The previous production revision before this launch is `hanson-app-00005-qrn`.

To restore it without touching customer records:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-00005-qrn=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

Do not delete older revisions or change the database when rolling back. The first basic-intake launch required no migration. Ventrix integration adds PartnerDelivery; it is safe to retain this table when rolling back.

## Ventrix deployment

Apply `server/prisma/sql/20260914-partner-delivery.sql` once through an authenticated database connection before deploying the partner-enabled backend. It only adds a table; it does not modify existing leads. This repository’s original database was not created with Prisma migration history, so use this reviewed additive SQL rather than a schema reset or automatic migration baseline.

Cloud Run configuration: `--update-secrets=VENTRIX_API_KEY=ventrix-partner-api-key:1 --update-env-vars=VENTRIX_SUBMISSIONS_ENABLED=true`. Preserve every existing runtime setting. Roll back this integration to `hanson-app-revamp-20260913` if needed; retain the delivery table and records. Failed/uncertain sends need staff attention at `ops.hansonhome.us`; no background resend job runs.

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

## Programs and tracking consent deployment (October 1, 2026)

Production serves `hanson-app-programs-consent-20261001-c2515a9` at 100% traffic.
Source: `c2515a9` on `codex/programs-tracking-20261001`, including main through `066a50d`.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:e7059504723f7deb6a469d8392230a6cceee42a61ae562b161505f67a466db8b`.
Cloud Build: `2dc402ea-fce2-41bd-8171-f070565aa9b0`.

Includes explicit opt-in for browser Meta tracking and server-side conversions,
a home-page section linking all 56 towns, and home/footer links to `/trade-in`
and `/veterans-discount`. Trade-in credits are $100 single-zone, $300 multi-zone,
and $500 ducted or ceiling cassette. Veterans qualify for 15% off; education
discounts are not included. Program selections carry into the estimate notes.
No database migration or runtime environment change was needed.

Validation: 70 frontend tests and 15 backend tests passed. The staged revision
and public domain passed page, asset, health, sitemap, staff-isolation and intake
validation checks. No live customer/partner test submissions were created.

Immediate rollback (retains database and runtime configuration):

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-winter-guide-066a50d=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

## Mass Save assessment article publication (October 3, 2026)

Approved article: https://hansonhome.us/blog/mass-save-assessment-before-heat-pump
English, Spanish, Simplified Chinese and Portuguese editions are published.
Publication PR: #16; build-time optional-summary typing fix: #17.
The other four topics in draft PR #15 remain unpublished.

Production revision: `hanson-app-assessment-20261003`.
Deployment source: `399edf5` on `codex/deploy-assessment-20261003`, combining
main's approved article with the previously live `920836d` consent/program changes.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:b2f34d8c565c4f47a62eac0dcc9e263d68d0afa3ad25522aada02cbfb04d3ae5`.
Cloud Build: `320d4ce2-3353-4261-b75a-255687c3a57a`.

Validation: 74 frontend and 15 server tests passed; public production build passed.
The zero-traffic revision passed checks for all four articles, citations,
publication dates, alternate language links, blog listing, sitemap, JS assets,
other draft exclusion, health, program pages, public staff isolation and invalid
intake rejection. No live customer or partner test submission was created.
Environment, service account, resources and database attachments were preserved.
No schema migration was needed.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-compact-consent-20261003-920836d=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com
