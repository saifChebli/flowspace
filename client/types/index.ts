export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  _count?: { members: number; projects: number };
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  channels?: Channel[];
  members?: ProjectMember[];
}

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CLIENT_VISIBLE';
  description: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  attachments?: { file: FileRecord }[];
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  lists: BoardList[];
}

export interface BoardList {
  id: string;
  boardId: string;
  name: string;
  position: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  dueDate: string | null;
  labels: string[];
  completedAt: string | null;
  assignees?: { user: Pick<User, 'id' | 'name' | 'avatarUrl'> }[];
}

export interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
  uploadedBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  task: Pick<Task, 'id' | 'title'> | null;
}

export interface ProjectMember {
  userId: string;
  role: 'MEMBER' | 'CLIENT';
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}
