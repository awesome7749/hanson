import { Storage } from '@google-cloud/storage';
import path from 'path';

export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(projectId: string, bucketName: string) {
    this.storage = new Storage({ projectId });
    this.bucketName = bucketName;
  }

  /**
   * Upload a photo buffer to GCS.
   * Returns the public URL and bucket-relative path.
   */
  async uploadPhoto(
    buffer: Buffer,
    leadId: string,
    photoKey: string,
    mimeType: string
  ): Promise<{ gcsUrl: string; gcsPath: string }> {
    const ext = this.mimeToExt(mimeType);
    const gcsPath = `leads/${leadId}/${photoKey}-${Date.now()}${ext}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(gcsPath);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false,
    });

    const gcsUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;

    return { gcsUrl, gcsPath };
  }

  /**
   * Get a readable stream for a GCS object (for proxying to client).
   */
  getReadStream(gcsPath: string) {
    const bucket = this.storage.bucket(this.bucketName);
    return bucket.file(gcsPath).createReadStream();
  }

  /**
   * Delete a photo from GCS by its bucket-relative path.
   */
  async deletePhoto(gcsPath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(gcsPath).delete({ ignoreNotFound: true });
  }

  private mimeToExt(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'image/heif': '.heif',
    };
    return map[mimeType] || '.jpg';
  }
}
