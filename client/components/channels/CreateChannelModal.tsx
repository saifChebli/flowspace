'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, Lock, Eye } from 'lucide-react';
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
      toast.success('Channel created');
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
      toast.error(msg);
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
        <p className="text-sm leading-6 text-muted-foreground">
          Keep delivery communication structured with channels for internal work, private ops, or client-visible updates.
        </p>
        <div>
          <label className="form-label">Channel name</label>
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
          <label className="form-label">Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'PUBLIC' as const, label: 'Public', icon: Hash },
              { value: 'PRIVATE' as const, label: 'Private', icon: Lock },
              { value: 'CLIENT_VISIBLE' as const, label: 'Client', icon: Eye },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  type === value
                    ? 'border-accent/30 bg-accent-soft text-accent'
                    : 'border-border/70 bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Description</label>
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
