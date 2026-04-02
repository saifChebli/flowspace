import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { presignUploadSchema } from './schema';
import { z } from 'zod';

export async function presign(req: Request, res: Response, next: NextFunction) {
  try {
    const input = presignUploadSchema.parse(req.body);
    res.json(await svc.presignUpload(req.params.projectId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const input = presignUploadSchema.extend({ key: z.string().min(1) }).parse(req.body);
    res.status(201).json(await svc.confirmUpload(req.params.projectId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getProjectFiles(req.params.projectId, req.user!.id));
  } catch (err) { next(err); }
}

export async function download(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getFileDownloadUrl(req.params.fileId, req.user!.id));
  } catch (err) { next(err); }
}
