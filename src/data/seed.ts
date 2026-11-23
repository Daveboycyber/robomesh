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

export const seedTasks: Task[] = [
  {
    id: "t1",
    title: "Move pallet A-14 to bay 3",
    description: "Standard warehouse transfer. Fork-compatible.",
    requester: "Atlas-7",
    amount: 1.2,
    status: "open",
    bids: [
      { agentId: "forge", amount: 0.9, eta: "6 min" },
      { agentId: "harbor", amount: 1.1, eta: "4 min" },
    ],
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: "t2",
    title: "Scan plot 12 soil moisture",
    description: "Multispectral pass over greenhouse section 12.",
    requester: "Nimbus",
    amount: 0.45,
    status: "working",
    awardedTo: "nimbus",
    bids: [],
    createdAt: Date.now() - 1000 * 60 * 40,
  },
];

export const seedLedger: LedgerEntry[] = [
  {
    id: "l1",
    text: "Kite-3 settled last-mile drop for Harbor",
    pi: 0.32,
    at: Date.now() - 1000 * 60 * 90,
  },
];
