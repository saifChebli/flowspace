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
  members?: { role: 'ADMIN' | 'MEMBER' }[];
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
  myRole?: 'MEMBER' | 'CLIENT' | null;
}

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CLIENT_VISIBLE';
  description: string | null;
  createdAt: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  channelId: string;
  body: string;
  parentId?: string | null;
  editedAt: string | null;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  attachments?: { file: FileRecord }[];
  _count?: { replies: number };
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
  estimatedMinutes: number | null;
  completedAt: string | null;
  assignees?: { user: Pick<User, 'id' | 'name' | 'avatarUrl'> }[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  minutes: number;
  note: string | null;
  date: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
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

export interface WorkspaceMember {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[];
}

export interface InviteToken {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

// ── Dashboard aggregation types ────────────────────────────────────────────

export interface DashboardStats {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  members: number;
  files: number;
  channels: number;
  priority: Record<string, number>;
}

export interface DashboardLane {
  id: string;
  name: string;
  boardName: string;
  totalTasks: number;
  openTasks: number;
}

export interface DashboardData {
  project: { id: string; name: string; description: string | null; archived: boolean; createdAt: string };
  stats: DashboardStats;
  lanes: DashboardLane[];
  recentFiles: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    uploadedBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  }[];
  clientVisibilityScore: number | null;
  role: 'MEMBER' | 'CLIENT';
}

export interface ActivityItem {
  id: string;
  kind: 'message' | 'notification' | 'comment';
  title: string;
  meta: string;
  actor: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  createdAt: string;
}

export interface ActivityFeed {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface ClientPortalData {
  project: { id: string; name: string; description: string | null };
  channels: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { messages: number };
  }[];
  recentMessages: {
    id: string;
    body: string;
    createdAt: string;
    author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    channel: { id: string; name: string };
  }[];
  files: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    createdAt: string;
    uploadedBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  }[];
  lanes: { id: string; name: string; taskCount: number }[];
  totalTasks: number;
  role: 'MEMBER' | 'CLIENT';
}

// ── Portal types ───────────────────────────────────────────────────────────

export interface PortalProject {
  id: string;
  name: string;
  description: string | null;
}

export interface PortalSession {
  sessionToken: string;
  email: string;
  userId: string;
  projectId: string;
  project: PortalProject & { workspaceId: string };
}

export interface PortalProjectInfo {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { channels: number; files: number };
}
