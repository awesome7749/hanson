# Website intake integration

As of September 13, 2026, the production build connects basic requests to the existing Hanson Google Cloud backend. The separate Sites preview remains a browser-only demonstration. Ventrix assessment submission is connected for new requests with sharing permission. Automated quoting, customer accounts, project-photo uploads, appointment booking and incoming Ventrix status callbacks remain deferred.

## Live basic intake

- Build with `REACT_APP_DEPLOYMENT_MODE=live`; the root Dockerfile sets this and runs `my-app/scripts/prepare-live.cjs` after building. The default local/Sites build keeps preview behavior.
- `POST /api/requests` accepts `{ draft }`, validates home/contact details and contact consent on the server, and returns only a receipt after database persistence succeeds. Eligible assessment requests are sent server-side to Ventrix after local persistence. Property lookup, prediction, email and SMS services are not called directly by Hanson.
- Each request uses a stable browser-generated ID mapped into a separate `web-` database ID namespace. Atomic upsert with no updates makes identical retries return the same receipt; changed data under an existing ID is rejected.
- Standard contact, address, utility and heating fields populate the existing Lead columns. The complete normalized draft, source, schema version and consent text version are preserved as JSON in the existing `corrections` text column. The database creation time records the submission/consent time. The full intake remains in this column; the additive PartnerDelivery table tracks Ventrix submission separately.
- `/admin` uses the existing staff password and live API. The staff detail view formats the full intake for reading. Admin tokens are signed and expire after eight hours so sign-in works across Cloud Run instances. Lead mutations, photos and legacy paid lookup endpoints now require staff authentication.
- The public site shows a receipt instead of the demo project dashboard. Date preferences are explicitly unconfirmed. Draft/receipt data in the browser is separate from server records; clearing browser data does not delete a submitted lead.
- The existing Cloud Run service and database settings are retained. Credentials are excluded from source archives and frontend bundles.

The onboarding document shaped the fields; no partner credential is present in the website source.


## Ventrix submission (September 14, 2026)

- The API key is held in Google Secret Manager as `ventrix-partner-api-key` in project `hanson-hvac`. Cloud Run references version 1 as `VENTRIX_API_KEY`. The existing runtime service account has access to this secret only through its secret-level accessor grant; no key value is included in source, browser code or deployment arguments.
- `VENTRIX_SUBMISSIONS_ENABLED=true` enables outgoing submission. Only newly submitted assessment requests with explicit `partnerConsent` are queued. Heat-pump-only requests and historical records are not forwarded. Resumed old browser drafts must accept the updated assessment-sharing notice.
- The local lead and PartnerDelivery entry are created in one database transaction. The outbound payload uses the saved lead ID as `external_lead_id`, preserves the ZIP as a string, joins street/unit, combines names, normalizes phone numbers, and sends date preference only when supplied. Property/utility context is included in the documented notes field because the handover does not specify property enum values.
- The server attempts delivery before returning the locally saved receipt, with an eight-second network timeout. A failure does not remove the local lead or imply that an appointment is booked. The Ventrix response ID, attempt count and outcome are saved in PartnerDelivery.
- A database claim prevents concurrent sends. Successful sends are never repeated on browser retries. Rejected requests are marked `failed`; network timeouts, 5xx responses or malformed success responses are `unknown`, since Ventrix might have accepted the lead. Do not assume its endpoint deduplicates `external_lead_id`.
- Staff see delivery status and the Ventrix reference in `/admin`. Failed/pending deliveries can be retried there. Unknown or interrupted deliveries require staff to check Ventrix for the existing request and explicitly confirm it was not received before retrying. No unattended retry job is configured.
- Incoming status webhooks are not configured in this phase. They still require a signed receiver plus configuration on the Ventrix side. Delivery status in Hanson is not appointment status.

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
