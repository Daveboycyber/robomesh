export type AgentStatus = "idle" | "negotiating" | "working" | "offline";

export type TaskStatus =
  | "open"
  | "negotiating"
  | "awarded"
  | "working"
  | "settled"
  | "cancelled";

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
  round: number;
  active: boolean;
}

export type NegotiationEventType =
  | "opened"
  | "bid"
  | "counter"
  | "revise"
  | "award"
  | "cancel";

export interface NegotiationEvent {
  id: string;
  at: number;
  type: NegotiationEventType;
  message: string;
  round: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  requester: string;
  requesterId?: string;
  /** Original offer / budget ceiling */
  amount: number;
  /** Optional counter ceiling set by requester */
  counterAmount?: number;
  status: TaskStatus;
  bids: Bid[];
  round: number;
  history: NegotiationEvent[];
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
