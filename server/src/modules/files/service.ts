import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { storageConfig } from '../../config/storage';
import { generateUploadSignature, buildCloudinaryUrl, deleteCloudinaryAsset } from '../../lib/cloudinary';
import { io } from '../../server';
import { logActivity } from '../../events/activity';
import type { PresignUploadInput, ConfirmUploadInput } from './schema';

/**
 * Return a Cloudinary signed-upload payload so the client can upload directly.
 */
export async function presignUpload(projectId: string, userId: string, input: PresignUploadInput) {
  await assertTeamMember(projectId, userId);

  if (!storageConfig.allowedMimeTypes.includes(input.mimeType as never)) {
    throw new AppError(415, 'Unsupported file type');
  }

  const folder = `${storageConfig.cloudinary.folder}/projects/${projectId}`;
  const signatureData = generateUploadSignature(folder);

  return signatureData;
}

/**
 * After the client uploads to Cloudinary, it sends back the public_id + secure_url.
 */
export async function confirmUpload(
  projectId: string,
  userId: string,
  input: ConfirmUploadInput,
) {
  await assertTeamMember(projectId, userId);

  const file = await prisma.file.create({
    data: {
      projectId,
      uploadedById: userId,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storage: 'CLOUDINARY',
      storageKey: input.publicId,
      url: input.secureUrl,
    },
  });

  // ─── Notify project members about new file ─────────────────────────
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });

  const recipientIds = members.map((m) => m.userId).filter((id) => id !== userId);

  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        actorId: userId,
        type: 'FILE_UPLOADED' as const,
        meta: { fileId: file.id, fileName: file.name, projectId },
      })),
    });

    // Push via Socket.io
    for (const rid of recipientIds) {
      io.to(`user:${rid}`).emit('notification:new');
    }
  }

  await logActivity({
    projectId,
    actorId: userId,
    type: 'FILE_UPLOADED',
    clientVisible: true, // files are visible to clients per PRD
    meta: { fileId: file.id, fileName: file.name },
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

  // Cloudinary secure URLs are public, return directly
  return { url: file.url };
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}

async function assertTeamMember(projectId: string, userId: string) {
  const member = await assertProjectMember(projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot upload files');
  return member;
}
