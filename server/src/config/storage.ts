import { env } from './env';

export const storageConfig = {
  provider: env.S3_BUCKET_NAME ? 's3' : 'cloudinary',
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'video/mp4',
  ],
  s3: {
    region: env.AWS_REGION ?? 'us-east-1',
    bucket: env.S3_BUCKET_NAME ?? '',
    presignExpiresIn: 3600, // 1 hour
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: env.CLOUDINARY_API_KEY ?? '',
    apiSecret: env.CLOUDINARY_API_SECRET ?? '',
    folder: 'collabspace',
  },
} as const;
