'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import type { Project } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceSlug: string;
}

export default function CreateProjectModal({ open, onClose, workspaceSlug }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<Project>(`/workspaces/${workspaceSlug}/projects`, {
        name,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
      setName('');
      setDescription('');
      setError('');
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create project.';
      setError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title="New project">
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Project name *</label>
          <input
            type="text"
            required
            autoFocus
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Website redesign"
            className="field-input"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            rows={2}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this project covers…"
            className="field-input resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button px-4 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="primary-button px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
