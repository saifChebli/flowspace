'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import api from '@/lib/api';

type Results = {
  messages: { id: string; body: string; createdAt: string; channel: { id: string; name: string } }[];
  tasks: { id: string; title: string; listId: string }[];
  files: { id: string; name: string; url: string }[];
};

export default function ProjectSearchPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isFetching } = useQuery<Results>({
    queryKey: ['search', projectId, submitted],
    queryFn: () => api.get(`/projects/${projectId}/search`, { params: { q: submitted } }).then((r) => r.data),
    enabled: submitted.length >= 2,
  });

  const empty = data && !data.messages.length && !data.tasks.length && !data.files.length;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(term.trim()); }}
        className="mb-6 flex gap-2"
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search tasks, messages, files…"
          className="field-input flex-1"
          autoFocus
        />
        <button type="submit" className="primary-button px-4 py-2 text-sm">
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
      {empty && <p className="text-sm text-muted-foreground">No results for “{submitted}”.</p>}

      {data && data.tasks.length > 0 && (
        <Section title="Tasks">
          {data.tasks.map((t) => (
            <Link key={t.id} href={`/${workspaceSlug}/${projectId}/board`} className="soft-row block rounded-lg px-4 py-2.5 text-sm hover:bg-white/60">
              {t.title}
            </Link>
          ))}
        </Section>
      )}
      {data && data.messages.length > 0 && (
        <Section title="Messages">
          {data.messages.map((m) => (
            <Link key={m.id} href={`/${workspaceSlug}/${projectId}/channels/${m.channel.id}`} className="soft-row block rounded-lg px-4 py-2.5 hover:bg-white/60">
              <p className="truncate text-sm">{m.body}</p>
              <p className="text-xs text-muted-foreground">#{m.channel.name}</p>
            </Link>
          ))}
        </Section>
      )}
      {data && data.files.length > 0 && (
        <Section title="Files">
          {data.files.map((f) => (
            <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="soft-row block rounded-lg px-4 py-2.5 text-sm hover:bg-white/60">
              {f.name}
            </a>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
