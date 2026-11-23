import type { Agent, Task, LedgerEntry } from "@/types";

export const seedAgents: Agent[] = [
  {
    id: "atlas",
    name: "Atlas-7",
    maker: "Northline",
    role: "Warehouse mover",
    capabilities: ["lift", "navigate-indoor", "pallet"],
    status: "idle",
    x: 22,
    y: 28,
    reputation: 4.7,
  },
  {
    id: "nimbus",
    name: "Nimbus",
    maker: "Fieldline",
    role: "Ag survey drone",
    capabilities: ["aerial", "multispectral", "mapping"],
    status: "negotiating",
    x: 68,
    y: 22,
    reputation: 4.4,
  },
  {
    id: "kite",
    name: "Kite-3",
    maker: "Harborworks",
    role: "Last-mile courier",
    capabilities: ["outdoor", "package", "doorstep"],
    status: "working",
    x: 78,
    y: 62,
    reputation: 4.9,
  },
  {
    id: "forge",
    name: "Forge",
    maker: "Anvil Lab",
    role: "Assembly cell",
    capabilities: ["assemble", "inspect", "tool-change"],
    status: "idle",
    x: 34,
    y: 72,
    reputation: 4.2,
  },
  {
    id: "harbor",
    name: "Harbor",
    maker: "Dock OS",
    role: "Port crane",
    capabilities: ["heavy-lift", "container", "yard"],
    status: "idle",
    x: 52,
    y: 46,
    reputation: 4.6,
  },
];

const now = Date.now();

export const seedTasks: Task[] = [
  {
    id: "t1",
    title: "Move pallet A-14 to bay 3",
    description: "Standard warehouse transfer. Fork-compatible.",
    requester: "Atlas-7",
    amount: 1.2,
    status: "open",
    round: 1,
    bids: [
      { agentId: "forge", amount: 0.9, eta: "6 min", round: 1, active: true },
      { agentId: "harbor", amount: 1.1, eta: "4 min", round: 1, active: true },
    ],
    history: [
      {
        id: "h1",
        at: now - 1000 * 60 * 12,
        type: "opened",
        message: "Task opened at 1.20 π",
        round: 1,
      },
      {
        id: "h2",
        at: now - 1000 * 60 * 11,
        type: "bid",
        message: "Forge bid 0.90 π · 6 min",
        round: 1,
      },
      {
        id: "h3",
        at: now - 1000 * 60 * 10,
        type: "bid",
        message: "Harbor bid 1.10 π · 4 min",
        round: 1,
      },
    ],
    createdAt: now - 1000 * 60 * 12,
  },
  {
    id: "t2",
    title: "Scan plot 12 soil moisture",
    description: "Multispectral pass over greenhouse section 12.",
    requester: "Nimbus",
    amount: 0.45,
    status: "working",
    awardedTo: "nimbus",
    round: 1,
    bids: [
      { agentId: "nimbus", amount: 0.45, eta: "12 min", round: 1, active: false },
    ],
    history: [
      {
        id: "h4",
        at: now - 1000 * 60 * 40,
        type: "opened",
        message: "Task opened at 0.45 π",
        round: 1,
      },
      {
        id: "h5",
        at: now - 1000 * 60 * 38,
        type: "award",
        message: "Awarded to Nimbus",
        round: 1,
      },
    ],
    createdAt: now - 1000 * 60 * 40,
  },
];

export const seedLedger: LedgerEntry[] = [
  {
    id: "l1",
    text: "Kite-3 settled last-mile drop for Harbor",
    pi: 0.32,
    at: now - 1000 * 60 * 90,
  },
];
