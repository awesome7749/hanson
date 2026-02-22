import { PrismaClient } from '@prisma/client';
import { HVACPrediction } from '../types';

const prisma = new PrismaClient();

export { prisma };

export class DatabaseService {
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
    predictions: Array<{ variant: string; prediction: HVACPrediction }>
  ) {
    // Clear old predictions for this lead
    await prisma.prediction.deleteMany({ where: { leadId } });

    const created = await Promise.all(
      predictions.map(({ variant, prediction }) =>
        prisma.prediction.create({
          data: {
            leadId,
            variant,
            numberOfODU: prediction.numberOfODU,
            typeOfODU: prediction.typeOfODU,
            oduSize: prediction.oduSize,
            numberOfIDU: prediction.numberOfIDU,
            typeOfIDU: prediction.typeOfIDU,
            iduSize: prediction.iduSize,
            electricalWorkEstimate: prediction.electricalWorkEstimate,
            hvacWorkEstimate: prediction.hvacWorkEstimate,
            confidence: prediction.confidence,
            reasoning: prediction.reasoning,
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
    return prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { predictions: true, photos: true },
        },
      },
    });
  }

  /**
   * Get a single lead with full predictions and photos.
   */
  async getLeadById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        predictions: { orderBy: { createdAt: 'asc' } },
        photos: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  /**
   * Get a single photo by ID.
   */
  async getPhotoById(id: string) {
    return prisma.photo.findUnique({ where: { id } });
  }
}
