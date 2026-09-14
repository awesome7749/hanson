# Hanson Home website

The redesigned React website lives in this `my-app` directory of the `hanson` website repository. The separate `hansonhome` sales/project-tracking application is not a dependency.

## Run and check

Use Node.js 20 or newer, then `npm ci` and `npm start`. Run `CI=true npm test -- --watchAll=false --runInBand` for the intake and project checks; `npm run build` creates a static production build in `build/`.

React Router 7 uses package exports that the existing CRA/Jest 27 resolver does not understand. The Jest module mappings in package.json point tests to the installed CommonJS entries; browser imports are unchanged.

## Explore the private preview

- `/`: New Massachusetts-focused homepage using the supplied Hanson mascot.
- `/heat-pumps`: Heating and cooling explainer, cold-climate design, cost factors and FAQs.
- `/assessment`: Mass Save Home Energy Assessment overview, eligibility context and visit preparation.
- `/how-it-works`: Six installation stages, homeowner preparation and handover expectations.
- `/warranty`: Equipment versus labor coverage, registration questions and system care.
- `/start?intent=heat-pump`: Shared heat-pump intake; no central-versus-ductless gate.
- `/start?intent=assessment`: Shorter energy-assessment intake.
- `/project`: Most recent request, profile editing, equipment-photo previews and assessment date preferences.
- `/staff`: Searchable demo requests, status changes, internal notes and sample appointments.
- `/privacy`: Demo storage explanation and reset control.

The intake captures structured address, property, existing comfort systems, utility and assessment context, timeline, contact preferences and separate service/marketing consent. Technical questions have a “Not sure” option. Review/edit precedes saving. Existing draft progress survives a refresh within the same browser session. Photos are local object-URL previews, not uploads, and must be reattached after refresh.

In the default preview build, functionality uses a React context store in `src/revamp/Store.tsx`. Demo requests and drafts are stored in sessionStorage; staff and customer screens show the same local records. The preview has no staff authentication, API submission, appointment booking, pricing calculation or notification sending. Use sample details only. An assessment date is explicitly an unconfirmed preference.

## Design

Warm Stone palette: chalk (#FAF8F5), putty (#E6DFD5), stone (#D1C8B9), dark taupe (#65594B), and charcoal (#302D29); Manrope headings, DM Sans text and a restrained serif accent. The supplied penguin mascot is preserved in `public/images/hanson-mascot.png`. The family, home-conversation and everyday-comfort scenes are original AI-generated lifestyle images. They are illustrative scenes, not customer testimonials or staff portraits. Their exact prompts and final asset paths are recorded in docs/lifestyle-image-prompts.json. The home illustration remains on the service-area page as generated concept artwork, not a completed Hanson installation. Layouts adapt for desktop and small screens; forms use labelled inputs, keyboard controls and inline errors.

## Production and remaining integration

The homeowner guides link to Mass Save, ENERGY STAR and Department of Energy-hosted installation guidance checked on September 13, 2026. Ventrix Supply is confirmed by the owner as Hanson’s sister business. The website now links its TCL equipment brochures and explains conditional extended equipment coverage up to 10 years. Hanson installation labor terms, maintenance plans and public contact details still need confirmation. See docs/ventrix-content-sources.md for product-specific evidence and conflicting supplier warranty language.

`src/revamp/model.ts` defines the draft, lead and display statuses. The live build uses `REACT_APP_DEPLOYMENT_MODE=live` to submit to the existing backend at `/api/requests`, show a saved-request receipt, and provide password-protected staff access at `/admin`. New consented assessment requests are sent to Ventrix from the server. Incoming status webhooks, real appointment booking, customer accounts, photo uploads and direct notifications remain deferred. See `docs/integration-notes.md` for storage and partner mapping, and `../docs/production-deployment.md` for deployment and rollback instructions. The root Dockerfile builds the frontend and backend together for hansonhome.us.

## Private preview hosting

`.openai/hosting.json` identifies a separate owner-private Sites preview. It does not deploy to hansonhome.us. The deployed source is a frontend-only snapshot with no parent repository history, backend, environment files or onboarding credentials. The snapshot lives at `/Users/hangao/Documents/ChatGPT/Hanson Home/.codex-work/website-preview` on this machine. Future edits should be made here in the website repository and synchronized to that snapshot before validation and publication.
