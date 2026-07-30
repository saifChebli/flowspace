import type { ChannelType } from '@prisma/client';

export interface ProjectTemplate {
  id: string;
  label: string;
  description: string;
  channels: { name: string; type: ChannelType }[];
  /** Ordered board columns. The LAST entry is treated as the completion column. */
  lists: string[];
}

/** Index of the column that means "finished" for a template's list set. */
export function doneColumnIndex(lists: string[]): number {
  return lists.length - 1;
}

// ponytail: built-in templates as data, not a DB model — add saved/custom
// templates when someone actually needs to author their own.
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  client: {
    id: 'client',
    label: 'Client project',
    description: 'A general client engagement with an internal channel and a client-visible one.',
    channels: [
      { name: 'general', type: 'PUBLIC' },
      { name: 'client-updates', type: 'CLIENT_VISIBLE' },
    ],
    lists: ['To Do', 'In Progress', 'Review', 'Done'],
  },
  website: {
    id: 'website',
    label: 'Website build',
    description: 'Discovery through launch, for design and build engagements.',
    channels: [
      { name: 'general', type: 'PUBLIC' },
      { name: 'design', type: 'PUBLIC' },
      { name: 'client-updates', type: 'CLIENT_VISIBLE' },
    ],
    lists: ['Discovery', 'Design', 'Build', 'QA', 'Launched'],
  },
  content: {
    id: 'content',
    label: 'Content calendar',
    description: 'Editorial pipeline from idea to published.',
    channels: [
      { name: 'general', type: 'PUBLIC' },
      { name: 'client-updates', type: 'CLIENT_VISIBLE' },
    ],
    lists: ['Ideas', 'Drafting', 'Review', 'Scheduled', 'Published'],
  },
  blank: {
    id: 'blank',
    label: 'Blank',
    description: 'Just the project — add your own channels and board.',
    channels: [],
    lists: [],
  },
};

export const templateList = Object.values(PROJECT_TEMPLATES).map(({ id, label, description }) => ({
  id,
  label,
  description,
}));
