export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface ApiWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: Date;
}

export interface ApiProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: Date;
}

export interface ApiChannel {
  id: string;
  projectId: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CLIENT_VISIBLE';
  description: string | null;
  createdAt: Date;
}

export interface ApiMessage {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  editedAt: Date | null;
  createdAt: Date;
}

export interface ApiTask {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  dueDate: Date | null;
  labels: string[];
  completedAt: Date | null;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}
