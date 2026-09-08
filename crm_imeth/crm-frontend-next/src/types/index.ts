// ─── Auth / User ───────────────────────────────────────────
export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  tenantId: string;
}

// ─── Lead ──────────────────────────────────────────────────
export interface Lead {
  id: string;
  phoneNumber: string;
  name?: string;
  displayName?: string;
  whatsappNumber?: string;
  email?: string;
  notes?: string;
  status: string;
  category?: string;
  tags: string[];
  tenantId: string;
  assignedToId?: string;
  assignedTo?: { id: string; name?: string; email: string; role: string };
  attribution?: CampaignAttribution;
  messages?: Message[];
  followups?: Followup[];
  activities?: Activity[];
  _count?: { followups: number; messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAttribution {
  id: string;
  leadId: string;
  sourceUrl?: string;
  adId?: string;
  sourceType?: string;
  headline?: string;
  body?: string;
  ctwaClid?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  messageId: string;
  leadId: string;
  direction: string;
  body: string;
  timestamp?: string;
  createdAt: string;
}

export interface Followup {
  id: string;
  leadId: string;
  createdById?: string;
  createdBy?: { id: string; name?: string; email: string; role?: string };
  assignedToId?: string;
  assignedTo?: { id: string; name?: string; email: string; role?: string };
  type: string;
  dueAt?: string;
  note?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity / Timeline ───────────────────────────────────
export interface Activity {
  id: string;
  leadId: string;
  createdById?: string;
  createdBy?: { id: string; name?: string; email: string; role?: string };
  type: string;
  title?: string;
  description?: string;
  occurredAt: string;
  createdAt: string;
}

// ─── Pipeline / Deal ───────────────────────────────────────
export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  stages?: PipelineStage[];
  _count?: { stages: number; deals: number };
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  position: number;
  createdAt: string;
  _count?: { deals: number };
}

export type DealStatus = "open" | "won" | "lost";

export interface Deal {
  id: string;
  pipelineId: string;
  stageId: string;
  tenantId: string;
  leadId?: string;
  assignedToId?: string;
  title: string;
  value: number;
  currency: string;
  notes?: string;
  expectedCloseDate?: string;
  status: DealStatus;
  createdAt: string;
  updatedAt?: string;
  lead?: { id: string; name?: string; phoneNumber: string };
  assignedTo?: { id: string; email: string };
  stage?: PipelineStage;
}

// ─── Flow / Automation ─────────────────────────────────────
export type FlowStatus = "draft" | "active" | "archived";
export type FlowTriggerType = "keyword" | "first_inbound" | "manual";
export type FlowNodeType = "start" | "send_message" | "condition" | "handoff" | "end";

export interface Flow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: FlowStatus;
  triggerType: FlowTriggerType;
  triggerConfig: Record<string, unknown>;
  entryNodeId?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  nodes?: FlowNode[];
  _count?: { nodes: number };
}

export interface FlowNode {
  id: string;
  flowId: string;
  nodeKey: string;
  nodeType: FlowNodeType;
  config: Record<string, unknown>;
  posX: number;
  posY: number;
}

// ─── Dashboard Stats ───────────────────────────────────────
export interface DashboardStats {
  totalLeads: number;
  statusBreakdown: Record<string, number>;
  pendingFollowups: number;
  recentLeads: Lead[];
}

// ─── Notifications ─────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}
