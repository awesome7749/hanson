import { parseWebsiteRequest, parsePartialRequest, partialLeadData, websiteLeadData, RequestConflictError, UtmParams } from './websiteRequest';
import { ventrixPayload } from './ventrixPayload';
import { deliverySummary } from './ventrixService';
import { PrismaClient } from '@prisma/client';
import { QuoteResult } from './quoteCalculatorService';

const prisma = new PrismaClient();

export { prisma };

export class DatabaseService {
  // Step-one submission: store name + phone + ZIP immediately so an abandoned
  // form still leaves a lead we can call. The full request later upgrades the
  // same record; an already-completed record is never downgraded.
  async createPartialRequest(draft: ReturnType<typeof parsePartialRequest>, utm: UtmParams = {}) {
    return prisma.$transaction(async (tx) => {
      const probe = partialLeadData(draft, utm);
      const existing = await tx.lead.findUnique({
        where: { id: probe.id },
        select: { id: true, createdAt: true, status: true, corrections: true },
      });
      if (!existing) {
        const lead = await tx.lead.create({ data: probe, select: { id: true, createdAt: true, status: true } });
        return { ...lead, created: true };
      }
      const meta = JSON.parse(existing.corrections || '{}');
      if (meta.partial) {
        // A repeated step-one submit refreshes the contact details but must
        // not wipe the ad attribution captured on the first visit.
        const data = partialLeadData(draft, Object.keys(utm).length ? utm : meta.utm || {});
        const lead = await tx.lead.update({
          where: { id: data.id },
          data: { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, addressRaw: data.addressRaw, corrections: data.corrections },
          select: { id: true, createdAt: true, status: true },
        });
        return { ...lead, created: false };
      }
      return { id: existing.id, createdAt: existing.createdAt, status: existing.status, created: false };
    });
  }

  async createWebsiteRequest(draft: ReturnType<typeof parseWebsiteRequest>, enqueuePartner = false, utm: UtmParams = {}) {
    return prisma.$transaction(async (tx) => {
      const probe = websiteLeadData(draft, utm);
      const lead = await tx.lead.upsert({
        where: { id: probe.id }, create: probe, update: {},
        select: { id: true, createdAt: true, status: true, corrections: true },
      });
      const meta = JSON.parse(lead.corrections || '{}');
      if (meta.partial) {
        // Upgrade the step-one partial lead in place, keeping its ad attribution
        // if this submission arrived without any (e.g. a new session).
        const { id: leadId, ...data } = websiteLeadData(draft, Object.keys(utm).length ? utm : meta.utm || {});
        const upgraded = await tx.lead.update({
          where: { id: leadId },
          data,
          select: { id: true, createdAt: true, status: true },
        });
        if (enqueuePartner && draft.consent && draft.partnerConsent) {
          await tx.partnerDelivery.upsert({
            where: { leadId }, update: {},
            create: { leadId, payload: ventrixPayload(leadId, draft) },
          });
        }
        return { id: upgraded.id, createdAt: upgraded.createdAt, status: upgraded.status };
      }
      const saved = meta.draft;
      if (!saved || Object.entries(draft).some(([key, value]) => (saved[key] ?? (key === 'partnerConsent' ? false : undefined)) !== value)) {
        throw new RequestConflictError('This request was already received. Start a new request to send different details.');
      }
      if (enqueuePartner && draft.consent && draft.partnerConsent) {
        await tx.partnerDelivery.upsert({
          where: { leadId: lead.id }, update: {},
          create: { leadId: lead.id, payload: ventrixPayload(lead.id, draft) },
        });
      }
      return { id: lead.id, createdAt: lead.createdAt, status: lead.status };
    });
  }

  /**
   * Create a new lead with contact info and raw address.
   */
  async createLead(data: {
    addressRaw: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) {
    return prisma.lead.create({
      data: {
        addressRaw: data.addressRaw,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
    });
  }

  /**
   * Update a lead with partial data (survey, details, utilities, property data, status).
   */
  async updateLead(id: string, data: Record<string, any>) {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }

  /**
   * Save one or more HVAC predictions for a lead.
   * Deletes any existing predictions for this lead first (re-prediction).
   */
  async savePredictions(
    leadId: string,
    predictions: Array<{ variant: string; quote: QuoteResult }>
  ) {
    // Clear old predictions for this lead
    await prisma.prediction.deleteMany({ where: { leadId } });

    const created = await Promise.all(
      predictions.map(({ variant, quote }) =>
        prisma.prediction.create({
          data: {
            leadId,
            variant,
            systemType: quote.systemType,
            equipmentCost: quote.equipmentCost,
            laborCost: quote.laborCost,
            totalCost: quote.totalCost,
            rebate: quote.rebate,
            netCost: quote.netCostAfterRebate,
            quoteData: quote as any,
          },
        })
      )
    );

    return created;
  }

  /**
   * Save a photo record after GCS upload.
   */
  async savePhoto(data: {
    leadId: string;
    photoKey: string;
    gcsUrl: string;
    gcsPath: string;
    fileSize: number;
    mimeType: string;
  }) {
    return prisma.photo.create({ data });
  }

  /**
   * Get all leads with prediction and photo counts. Most recent first.
   */
  async getLeads() {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        partnerDelivery: true,
        _count: {
          select: { predictions: true, photos: true },
        },
      },
    });
    return leads.map(({ partnerDelivery, ...lead }) => ({ ...lead, partnerDelivery: deliverySummary(partnerDelivery) }));
  }

  /**
   * Get a single lead with full predictions and photos.
   */
  async getLeadById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        partnerDelivery: true,
        predictions: { orderBy: { createdAt: 'asc' } },
        photos: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!lead) return null;
    const { partnerDelivery, ...record } = lead;
    return { ...record, partnerDelivery: deliverySummary(partnerDelivery) };
  }

  /**
   * Get a single photo by ID.
   */
  async getPhotoById(id: string) {
    return prisma.photo.findUnique({ where: { id } });
  }
}
