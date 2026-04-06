'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardData } from '@/types';

interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
  uploadedBy: { id: string; name: string; avatarUrl: string | null };
}

const ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼',
  'image/jpeg': '🖼',
  'image/gif': '🖼',
  'image/webp': '🖼',
  'video/mp4': '🎬',
};

function fileIcon(mime: string) {
  return ICON[mime] ?? '📎';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectFilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const { data: files, isLoading } = useQuery<FileRecord[]>({
    queryKey: ['files', projectId],
    queryFn: () => api.get(`/projects/${projectId}/files`).then((r) => r.data),
  });

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['dashboard', projectId],
    queryFn: () => api.get<DashboardData>(`/projects/${projectId}/dashboard`).then((r) => r.data),
  });

  const isClient = dashboard?.role === 'CLIENT';

  const download = useMutation({
    mutationFn: (fileId: string) =>
      api.get<{ url: string }>(`/projects/${projectId}/files/${fileId}/download`).then((r) => r.data),
    onSuccess: ({ url }) => window.open(url, '_blank'),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    try {
      // Step 1: get Cloudinary signed params from our server
      const { data: signData } = await api.post<{
        signature: string;
        timestamp: number;
        folder: string;
        apiKey: string;
        cloudName: string;
      }>(`/projects/${projectId}/files/presign`, {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      // Step 2: upload directly to Cloudinary with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;

      const uploadResult = await new Promise<{ public_id: string; secure_url: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', cloudinaryUrl);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Cloudinary upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Upload network error'));
          xhr.send(formData);
        }
      );

      // Step 3: confirm on our server
      await api.post(`/projects/${projectId}/files/confirm`, {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
      });

      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Upload failed. Please check your storage configuration.';
      setUploadError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-xl px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Files</p>
            <h2 className="mt-1 text-xl font-bold">Project files</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isClient ? 'View and download shared project files.' : 'Upload and share files with your team and clients.'}
            </p>
          </div>
          {!isClient && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf,video/mp4,.doc,.docx,.xls,.xlsx,.zip"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="primary-button px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {uploading ? `Uploading… ${uploadProgress}%` : '+ Upload file'}
            </button>
            {uploading && (
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          )}
        </div>
        {uploadError && (
          <div className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {uploadError}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : files?.length === 0 ? (
        <div className="panel-card flex flex-col items-center justify-center rounded-xl py-16 text-center">
          <div className="mb-3 text-4xl">📁</div>
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
          {!isClient && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 secondary-button px-4 py-2 text-sm"
            >
              Upload the first file
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {files?.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-white/75 px-5 py-4 transition hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-xl">
                  {fileIcon(f.mimeType)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(f.sizeBytes)} · uploaded by {f.uploadedBy.name} ·{' '}
                    {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => download.mutate(f.id)}
                disabled={download.isPending}
                className="secondary-button px-3.5 py-2 text-xs"
              >
                {download.isPending ? '…' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
