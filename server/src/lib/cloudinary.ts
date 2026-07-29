import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { storageConfig } from '../config/storage';

cloudinary.config({
  cloud_name: storageConfig.cloudinary.cloudName,
  api_key: storageConfig.cloudinary.apiKey,
  api_secret: storageConfig.cloudinary.apiSecret,
  secure: true,
});

/**
 * Generate a signed upload payload for direct client-side upload.
 */
export function generateUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    params,
    storageConfig.cloudinary.apiSecret,
  );

  return {
    signature,
    timestamp,
    folder,
    apiKey: storageConfig.cloudinary.apiKey,
    cloudName: storageConfig.cloudinary.cloudName,
  };
}

/**
 * Build a Cloudinary delivery URL from a public_id.
 */
export function buildCloudinaryUrl(publicId: string, resourceType: string = 'auto') {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: resourceType as any,
  });
}

/**
 * Look up an uploaded asset's real metadata. Used to verify a client-reported
 * upload instead of trusting the size/URL it sends us. Returns null if absent.
 */
export async function getCloudinaryResource(
  publicId: string,
): Promise<{ bytes: number; format: string; secureUrl: string } | null> {
  for (const resourceType of ['image', 'video', 'raw'] as const) {
    try {
      const res = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return { bytes: res.bytes, format: res.format, secureUrl: res.secure_url };
    } catch {
      // Not this resource type — try the next.
    }
  }
  return null;
}

/**
 * Delete an asset by its public_id.
 */
export async function deleteCloudinaryAsset(publicId: string, resourceType: string = 'auto') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any });
}

export { cloudinary };
