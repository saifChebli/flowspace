'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import type { Workspace } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const slug = useMemo(() => customSlug || slugify(name), [customSlug, name]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<Workspace>('/workspaces', {
        name,
        slug: slug || undefined,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created');
      setName('');
      setDescription('');
      setCustomSlug('');
      setError('');
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create workspace.';
      toast.error(msg);
      setError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a workspace">
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Set up a dedicated space for projects, members, notifications, and client collaboration.
        </p>
        <div>
          <label className="form-label">Workspace name</label>
          <input
            type="text"
            required
            autoFocus
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Northstar Studio"
            className="field-input"
          />
        </div>
        <div>
          <label className="form-label">URL slug</label>
          <input
            type="text"
            maxLength={50}
            value={customSlug}
            onChange={(e) => setCustomSlug(slugify(e.target.value))}
            placeholder={slugify(name) || 'auto-generated'}
            className="field-input font-mono text-sm"
          />
          {slug && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your workspace URL will be <span className="font-semibold text-accent">/{slug}</span>
            </p>
          )}
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            rows={2}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this workspace is for…"
            className="field-input resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="secondary-button px-4 py-2.5 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isPending || !name.trim()} className="primary-button px-5 py-2.5 text-sm disabled:opacity-60">
            {isPending ? 'Creating…' : 'Create workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
