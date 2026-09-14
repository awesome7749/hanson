# Website intake integration

As of September 13, 2026, the production build connects basic requests to the existing Hanson Google Cloud backend. The separate Sites preview remains a browser-only demonstration. Partner APIs, automated quoting, customer accounts, project-photo uploads and appointment booking remain deferred.

## Live basic intake

- Build with `REACT_APP_DEPLOYMENT_MODE=live`; the root Dockerfile sets this and runs `my-app/scripts/prepare-live.cjs` after building. The default local/Sites build keeps preview behavior.
- `POST /api/requests` accepts `{ draft }`, validates home/contact details and contact consent on the server, and returns only a receipt after database persistence succeeds. No partner, property lookup, prediction, email or SMS service is called.
- Each request uses a stable browser-generated ID mapped into a separate `web-` database ID namespace. Atomic upsert with no updates makes identical retries return the same receipt; changed data under an existing ID is rejected.
- Standard contact, address, utility and heating fields populate the existing Lead columns. The complete normalized draft, source, schema version and consent text version are preserved as JSON in the existing `corrections` text column. The database creation time records the submission/consent time. No database migration is required.
- `/admin` uses the existing staff password and live API. The staff detail view formats the full intake for reading. Admin tokens are signed and expire after eight hours so sign-in works across Cloud Run instances. Lead mutations, photos and legacy paid lookup endpoints now require staff authentication.
- The public site shows a receipt instead of the demo project dashboard. Date preferences are explicitly unconfirmed. Draft/receipt data in the browser is separate from server records; clearing browser data does not delete a submitted lead.
- The existing Cloud Run service and database settings are retained. Credentials are excluded from source archives and frontend bundles.

The onboarding document shaped the fields; no partner credential is present in the website source.

## Shared request

Keep the stable internal request ID, intent, structured address, homeowner/contact records, home/equipment context, assessment history, utility providers, date preference, consent records, photos and a timeline of events together. Use the same request through intake, assessment coordination, project review and proposal preparation. Do not require the homeowner to select ducted versus ductless at intake.

`Store.tsx` in preview mode provides saveLead, updateLead and setPhoto for a browser-only demonstration. A future server layer should provide create/update request, load authorized customer project, list authorized staff requests, upload project photos and request assessment coordination. Server validation and real authorization are required before accepting customer records. The current /staff view is only a demonstration; UI hiding is not access control.

## Assessment partner mapping

From the provided onboarding document:

| Partner field      | Website data                                |
| ------------------ | ------------------------------------------- |
| homeowner_name     | firstName + lastName                        |
| address            | street + optional unit                      |
| city, state, zip   | structured address fields                   |
| email, phone       | homeowner contact information when supplied |
| preferred_hea_date | preferredDate; unconfirmed preference only  |
| external_lead_id   | stable internal request ID                  |

Additional property attributes can be mapped once the exact API integration is implemented. Preserve unknown answers distinctly from No. Additional contacts and preferred communication method belong to the internal record even if the initial partner endpoint does not support them. Record consent version and timestamp on the server at submission; the demo only stores selection state.

Partner submission should originate from the server, keep credentials in environment secrets, use the stable external lead ID to prevent duplicate submissions, and retain the returned partner lead ID. Track pending, successful and failed submission states with retry handling. Verify incoming webhook authenticity using the final agreed mechanism and apply events idempotently.

The supplied partner statuses include received, scheduled, assessment_completed, proposal_sent, won, lost, not_qualified and no_answer. Preserve those raw statuses and event times separately from customer-facing wording. The simplified demo statuses are not a final one-to-one mapping. Do not invent live appointment slots: the documented field is a date preference, with confirmation provided separately.

## Future project portal and partner launch

Before enabling a customer portal or partner workflow, add customer authentication, authorized record access, real photo storage and confirmed scheduling integration. Expand the privacy notice for any new data recipients or processing. Basic live intake and staff access are implemented above; project tracking and partner workflows remain deferred at the owner’s request.
