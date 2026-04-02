import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { storageConfig } from '../../config/storage';
import { getPresignedUploadUrl, getPresignedDownloadUrl, buildS3Url } from '../../lib/s3';
import type { PresignUploadInput } from './schema';

export async function presignUpload(projectId: string, userId: string, input: PresignUploadInput) {
  await assertProjectMember(projectId, userId);

  if (!storageConfig.allowedMimeTypes.includes(input.mimeType as never)) {
    throw new AppError(415, 'Unsupported file type');
  }

  const key = `projects/${projectId}/${uuidv4()}/${input.name}`;
  const uploadUrl = await getPresignedUploadUrl(key, input.mimeType);

  return { uploadUrl, key };
}

export async function confirmUpload(
  projectId: string,
  userId: string,
  input: PresignUploadInput & { key: string }
) {
  await assertProjectMember(projectId, userId);

  const url = buildS3Url(input.key);

  const file = await prisma.file.create({
    data: {
      projectId,
      uploadedById: userId,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storage: 'S3',
      storageKey: input.key,
      url,
    },
  });

  return file;
}

export async function getProjectFiles(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);

  return prisma.file.findMany({
    where: { projectId },
    include: { uploadedBy: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFileDownloadUrl(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new AppError(404, 'File not found');
  await assertProjectMember(file.projectId, userId);

  const url = await getPresignedDownloadUrl(file.storageKey);
  return { url };
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}
