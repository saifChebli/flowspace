import type { Message } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const messageTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export default function MessageBubble({ message }: { message: Message }) {
  const { user } = useAuthStore();
  const isOwn = message.author.id === user?.id;

  return (
    <div className={`group flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-[#eef2f7] ${
      isOwn ? 'bg-[#f8fbff]' : ''
    }`}>
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dbeafe] text-xs font-semibold text-[#1d4ed8] shadow-sm">
        {message.author.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#111827]">
            {message.author.name}
          </span>
          {isOwn && (
            <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4f46e5]">
              You
            </span>
          )}
          <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
            {messageTimeFormatter.format(new Date(message.createdAt))}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-[#334155]">
          {message.body}
        </p>
      </div>
    </div>
  );
}
