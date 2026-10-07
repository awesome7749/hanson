-- Additive change; no existing rows are touched. Ledger for the automatic
-- SMS sent to Facebook Instant Form leads (see services/fbLeadSms.ts).
CREATE TABLE IF NOT EXISTS "FbLeadSms" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT NOT NULL,
  "name" TEXT,
  "leadCreatedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
