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

Install the local IP database with `node server/scripts/download-tracking-database.cjs` (also runs during Docker build).
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

## Compact tracking notice deployment (October 3, 2026)

Production now serves `hanson-app-compact-consent-20261003-920836d` at 100% traffic.
Source: `920836d` on `codex/programs-tracking-20261001`.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:38739a9a1cd8b6ab77bd40920d963e3add19f7d4fc0bc2993afdeae1411c7a5d`.
Cloud Build: `946cdcaa-03a6-4df7-b263-2e3a353512cc`.

The tracking notice uses shorter text, a smaller card, neutral buttons and a
subtle Privacy choices control. Tracking still requires explicit opt-in.
Validation: 70 frontend and 15 backend tests passed, the public build succeeded,
staged page/asset/health checks passed, and the live mobile appearance was verified.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-programs-consent-20261001-c2515a9=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

## Regional Meta consent and startup fallback

`GET /api/tracking-policy` uses the final trusted Cloud Run proxy IP and returns
consent-required and show-notice flags with `private, no-store`.
Only a positively identified California IP triggers the automatic banner. California, unknown
locations, missing US states, unavailable databases and databases older than
90 days require explicit consent. Browser tracking waits for this lookup;
lookup failures/timeouts also require consent. Known locations outside California
allow tracking automatically unless the visitor previously declined. Privacy
choices remains available everywhere. Server-side Meta events independently
check location for automatically enabled tracking; prior explicit opt-ins remain
valid. This is IP-based classification and may not reflect a VPN user's location.

The current DB-IP City Lite release and SHA-256 are pinned in
`server/scripts/tracking-database.json`; the Docker build downloads/verifies the
file, and lookup happens locally without sending visitor IPs to a provider.
The database is distributed under CC BY 4.0; the public footer links to DB-IP
for attribution. Refresh the pinned release and hash at least every quarter,
verify known California/non-California/unknown fixtures, and deploy. If it becomes
stale, automatic tracking stays off and the automatic banner stays hidden
until updated. Visitors can still opt in through Privacy choices.

Public SEO HTML remains accessible with JavaScript disabled. An inline startup
guard hides that simplified fallback during React startup, and React reveals the
finished site before paint. If a script fails or startup takes longer than eight
seconds, the fallback is shown to keep the page usable.

## Regional consent and loading fix deployment (October 3, 2026)

Production now serves `hanson-app-regional-consent-20261003-e52b498` at 100% traffic.
Source: `e52b498` on `codex/programs-tracking-20261001`.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:b24ab8e9da84dba0bc3b8390d89da80ab9fdc0bd833a6003d1c9ce01c2bf1ad6`.
Cloud Build: `b5457bbe-aaa1-4edb-ad5b-cddf5dfcf02f`.

Validation: 77 frontend and 17 backend tests passed, the public build succeeded,
and browser checks verified the California/non-California prompts, remembered
declines, a hidden first-paint fallback with delayed bundles, and a visible
fallback without JavaScript or with failed bundles. Public and staged smoke
checks passed page/assets, health, sitemap, staff isolation, invalid intake
submissions and forwarded-header spoofing checks. The staged policy matched the
client location recorded by Cloud Run. The live mobile homepage was verified.
No customer/partner test submissions were created. The ops homepage returns 200.
No database schema or runtime environment changes were needed.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-compact-consent-20261003-920836d=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

## California-only automatic banner deployment (October 3, 2026)

Production now serves `hanson-app-ca-banner-20261003-cc5ab00` at 100% traffic.
Source: `cc5ab00` on `codex/programs-tracking-20261001`.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:a74b33bc6cba6e4273baaf81e9ebb4f23246507841a7c8bbc6594bfa55ecfd53`.
Cloud Build: `13dbedb6-03a5-481f-872a-2dbbed8d92d0`.

The automatic banner appears only for positively identified California IPs.
Non-California and unknown locations do not open it automatically. Unknown
locations still block tracking without explicit consent through Privacy choices.
Existing consent and decline behavior is retained.

Validation: all 78 existing frontend tests and 18 backend tests passed; the
three new banner-component cases also passed, for 81 frontend tests total.
The production frontend built successfully. Browser checks covered California,
non-California and unknown locations; staged and public page/assets/health,
staff isolation and forwarded-header spoofing checks passed. The live browser
showed no automatic banner for the non-California verification visit.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-regional-consent-20261003-e52b498=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

## Combined blog and consent release (October 3, 2026)

Production now serves `hanson-app-combined-blog-20261003-0c7898d` at 100% traffic.
Source: `0c7898d` on `codex/programs-tracking-20261001`, including main through
`1f1ede9`; the combined release is recorded in PR #18.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:f79ee6844100ead98831cbe872babc45eb243a02567062580b9de5be9f80e1bb`.
Cloud Build: `91aefb13-29a1-427a-a6bb-6f02f631fd3e`.

Includes the approved brand guide and Mass Save assessment guide with their
Spanish, Chinese and Portuguese editions. Removes featured photos from both
winter articles and their translated editions, retaining explanatory figures.
Preserves the compact California-only automatic notice, regional Meta consent,
startup fallback fix, all 56 service towns and both homeowner programs.

Validation: 85 frontend tests and 18 backend tests passed. Production builds and
prerendering succeeded. Staged and public checks passed all 13 published article
routes, sitemap entries, program pages, hashed assets, health, staff isolation,
invalid intake requests and forwarded-header spoofing. Browser checks confirmed
four cards without featured photos, no automatic notice for the non-California
visit, 56 town links and retained article figures. The ops homepage returns 200.
No customer/partner test submissions, database migrations or runtime environment
changes were made.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-ca-banner-20261003-cc5ab00=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com

## Installation carousel deployment (October 7, 2026)

Production serves `hanson-app-carousel-20261007-3323135` at 100% traffic.
Source: `3323135`, including main through `b9fa052`; PR #19.
Image: `gcr.io/hanson-hvac/hanson-app@sha256:56127103eb3301c72ad27318db8f687722f48382212e2dec0ebccd18632e9ae5`.
Cloud Build: `c70f9471-1091-4f56-afa2-11e4410fa913`.

The homepage installation photos use a manual carousel with three frames on
desktop, two on tablets and one plus a preview on phones. Selecting a photo
opens the complete image in a native modal viewer, with previous/next controls,
arrow keys, Escape-to-close, scroll locking and focus restoration.

Validation: 87 frontend tests passed, including new viewer interaction tests;
the production build succeeded. Local, staged and live browser checks verified
desktop and 390px layouts, navigation, all ten photos, the last-photo boundary,
uncropped viewing and no horizontal page overflow. Staged and public smoke checks
passed homepage/assets, photo assets, blog/program routes, health, non-California
tracking policy and public staff isolation. The ops homepage returns 200.
Existing runtime settings, lead integrations and database are retained. No
customer submissions or migrations were performed for this frontend change.

Immediate rollback:

    gcloud run services update-traffic hanson-app --to-revisions=hanson-app-gallery-20261007=100 --region=us-east1 --project=hanson-hvac --account=gaohan1990@gmail.com
