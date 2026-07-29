'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import type { Project } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceSlug: string;
}

type Template = { id: string; label: string; description: string };

export default function CreateProjectModal({ open, onClose, workspaceSlug }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('client');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['project-templates'],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects/templates`).then((r) => r.data),
    enabled: open,
    staleTime: Infinity,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<Project>(`/workspaces/${workspaceSlug}/projects`, {
        name,
        description: description || undefined,
        template,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
      toast.success('Project created');
      setName('');
      setDescription('');
      setError('');
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create project.';
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
    <Modal open={open} onClose={onClose} title="New project">
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Create a delivery space for tasks, files, channels, and project-specific members.
        </p>
        <div>
          <label className="form-label">Project name</label>
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
          <label className="form-label">Description</label>
          <textarea
            rows={2}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this project covers…"
            className="field-input resize-none"
          />
        </div>
        {templates && templates.length > 0 && (
          <div>
            <label className="form-label">Start from</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    template === t.id
                      ? 'border-accent/40 bg-accent-soft shadow-sm'
                      : 'border-border/60 bg-white/50 hover:border-border'
                  }`}
                >
                  <p className={`text-sm font-semibold ${template === t.id ? 'text-accent' : ''}`}>{t.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

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
