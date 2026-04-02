import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageConfig } from '../config/storage';
import { env } from '../config/env';

const s3 = new S3Client({
  region: storageConfig.s3.region,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

/**
 * Generate a pre-signed URL for direct browser-to-S3 upload.
 */
export async function getPresignedUploadUrl(
  key: string,
  mimeType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: storageConfig.s3.bucket,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(s3, command, {
    expiresIn: storageConfig.s3.presignExpiresIn,
  });
}

/**
 * Generate a pre-signed URL for downloading/viewing a private file.
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: storageConfig.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, {
    expiresIn: storageConfig.s3.presignExpiresIn,
  });
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: storageConfig.s3.bucket, Key: key })
  );
}

/**
 * Build the public CDN URL for an S3 object (for public buckets).
 */
export function buildS3Url(key: string): string {
  return `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${key}`;
}
