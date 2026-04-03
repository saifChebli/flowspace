'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import type { Channel } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function CreateChannelModal({ open, onClose, projectId }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE' | 'CLIENT_VISIBLE'>('PUBLIC');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<Channel>(`/projects/${projectId}/channels`, {
        name,
        type,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      setName('');
      setType('PUBLIC');
      setDescription('');
      setError('');
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create channel.';
      setError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title="New channel">
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Channel name *</label>
          <input
            type="text"
            required
            autoFocus
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="general"
            className="field-input font-mono"
          />
          <p className="mt-1 text-xs text-muted-foreground">Lowercase, alphanumeric and hyphens only.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            {(['PUBLIC', 'PRIVATE', 'CLIENT_VISIBLE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  type === t
                    ? 'border-accent/30 bg-accent-soft text-accent'
                    : 'border-border/70 bg-white/65 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'CLIENT_VISIBLE' ? 'Client visible' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this channel is for…"
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
            {isPending ? 'Creating…' : 'Create channel'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
