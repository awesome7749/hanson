import { parseWebsiteRequest, websiteLeadData, RequestConflictError } from './websiteRequest';
import { ventrixPayload } from './ventrixPayload';
import { deliverySummary } from './ventrixService';
import { PrismaClient } from '@prisma/client';
import { QuoteResult } from './quoteCalculatorService';

const prisma = new PrismaClient();

export { prisma };

export class DatabaseService {
  async createWebsiteRequest(draft: ReturnType<typeof parseWebsiteRequest>, enqueuePartner = false) {
    const data = websiteLeadData(draft);
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.upsert({
        where: { id: data.id }, create: data, update: {},
        select: { id: true, createdAt: true, status: true, corrections: true },
      });
      const saved = JSON.parse(lead.corrections || '{}').draft;
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
