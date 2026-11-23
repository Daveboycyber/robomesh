export type AgentStatus = "idle" | "negotiating" | "working" | "offline";

export type TaskStatus = "open" | "awarded" | "working" | "settled" | "cancelled";

export interface Agent {
  id: string;
  name: string;
  maker: string;
  role: string;
  capabilities: string[];
  status: AgentStatus;
  x: number;
  y: number;
  reputation?: number;
}

export interface Bid {
  agentId: string;
  amount: number;
  eta: string;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  requester: string;
  requesterId?: string;
  amount: number;
  status: TaskStatus;
  bids: Bid[];
  awardedTo?: string;
  createdAt: number;
}

export interface LedgerEntry {
  id: string;
  text: string;
  pi: number;
  at: number;
  taskId?: string;
}

export interface Operator {
  username: string;
  uid?: string;
  accessToken?: string;
}

export interface MeshState {
  agents: Agent[];
  tasks: Task[];
  ledger: LedgerEntry[];
  selectedAgentId: string | null;
  operator: Operator | null;
}
