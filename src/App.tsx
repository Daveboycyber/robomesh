import { useCallback, useMemo, useState } from "react";
import { MeshView } from "@/components/MeshView";
import { AgentRegistry } from "@/components/AgentRegistry";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Ledger } from "@/components/Ledger";
import { seedAgents, seedTasks, seedLedger } from "@/data/seed";
import { authenticatePi } from "@/lib/pi";
import type { Agent, LedgerEntry, Operator, Task } from "@/types";

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

function randomMeshPoint(): { x: number; y: number } {
  return {
    x: 12 + Math.random() * 76,
    y: 14 + Math.random() * 72,
  };
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(() => seedAgents.map((a) => ({ ...a })));
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks.map((t) => ({ ...t, bids: [...t.bids] })));
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => [...seedLedger]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("atlas");
  const [capabilityFilter, setCapabilityFilter] = useState("");
  const [operator, setOperator] = useState<Operator | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const visibleAgents = useMemo(() => {
    if (!capabilityFilter.trim()) return agents;
    const q = capabilityFilter.trim().toLowerCase();
    return agents.filter((a) => a.capabilities.some((c) => c.toLowerCase().includes(q)));
  }, [agents, capabilityFilter]);

  const selected = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0],
    [agents, selectedAgentId]
  );

  const signIn = useCallback(async () => {
    setAuthBusy(true);
    const result = await authenticatePi(["username", "payments"]);
    setAuthBusy(false);
    if (result) {
      setOperator({
        username: result.username,
        uid: result.uid,
        accessToken: result.accessToken,
      });
    } else {
      alert(
        "Pi sign-in failed or was cancelled. Open RoboMesh inside Pi Browser for the best experience."
      );
    }
  }, []);

  const registerAgent = useCallback(
    (input: Omit<Agent, "id" | "x" | "y" | "status" | "reputation">) => {
      const point = randomMeshPoint();
      const agent: Agent = {
        ...input,
        id: uid("a"),
        status: "idle",
        reputation: 4.0,
        x: point.x,
        y: point.y,
      };
      setAgents((prev) => [...prev, agent]);
      setSelectedAgentId(agent.id);
      setCapabilityFilter("");
    },
    []
  );

  const broadcastTask = useCallback(
    (title: string, amount: number) => {
      if (!selected) return;
      // Prefer agents matching current capability filter, else any other idle-ish agents
      const pool = agents.filter((a) => a.id !== selected.id);
      const preferred = capabilityFilter.trim()
        ? pool.filter((a) =>
            a.capabilities.some((c) =>
              c.toLowerCase().includes(capabilityFilter.trim().toLowerCase())
            )
          )
        : pool;
      const candidates = (preferred.length ? preferred : pool).slice(0, 3);

      setAgents((prev) =>
        prev.map((a) =>
          candidates.some((o) => o.id === a.id) ? { ...a, status: "negotiating" as const } : a
        )
      );

      const bids = candidates.map((a, i) => ({
        agentId: a.id,
        amount: Math.max(0.05, +(amount * (0.72 + i * 0.1)).toFixed(2)),
        eta: `${3 + i * 3} min`,
      }));

      const task: Task = {
        id: uid("t"),
        title,
        requester: selected.name,
        requesterId: selected.id,
        amount,
        status: "open",
        bids,
        createdAt: Date.now(),
      };

      setTasks((prev) => [task, ...prev]);
    },
    [agents, selected, capabilityFilter]
  );

  const award = useCallback((taskId: string, agentId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const bid = t.bids.find((b) => b.agentId === agentId);
        return {
          ...t,
          status: "working" as const,
          awardedTo: agentId,
          amount: bid?.amount ?? t.amount,
        };
      })
    );
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: "working" as const } : a))
    );
  }, []);

  const settle = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task?.awardedTo) return;
      const worker = agents.find((a) => a.id === task.awardedTo);

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "settled" as const } : t))
      );
      setAgents((prev) =>
        prev.map((a) =>
          a.id === task.awardedTo ? { ...a, status: "idle" as const } : a
        )
      );
      setLedger((prev) => [
        {
          id: uid("l"),
          text: `${worker?.name ?? "Agent"} settled “${task.title}” for ${task.requester}`,
          pi: task.amount,
          at: Date.now(),
          taskId,
        },
        ...prev,
      ]);
    },
    [tasks, agents]
  );

  const reset = useCallback(() => {
    setAgents(seedAgents.map((a) => ({ ...a })));
    setTasks(seedTasks.map((t) => ({ ...t, bids: [...t.bids] })));
    setLedger([...seedLedger]);
    setSelectedAgentId("atlas");
    setCapabilityFilter("");
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-title">RoboMesh</div>
            <div className="brand-sub">coordination · settlement · π</div>
          </div>
        </div>
        <div className="header-actions">
          {operator && <span className="user-chip">@{operator.username}</span>}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={signIn}
            disabled={authBusy || !!operator}
          >
            {operator ? "Signed in" : authBusy ? "Signing in…" : "Sign in with Pi"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <p className="banner">
        {operator
          ? `Signed in as @${operator.username}. Register agents, discover by capability, settle in π.`
          : "Agent registry is live. Register units, filter by capability, broadcast work to the mesh."}
      </p>

      <main className="main">
        <div className="stack">
          <section className="panel">
            <h2>Live mesh</h2>
            <MeshView
              agents={visibleAgents.length ? visibleAgents : agents}
              selectedId={selectedAgentId}
              onSelect={setSelectedAgentId}
            />
          </section>

          <section className="panel">
            <h2>Agent registry</h2>
            <AgentRegistry
              agents={agents}
              selectedId={selectedAgentId}
              capabilityFilter={capabilityFilter}
              onFilterChange={setCapabilityFilter}
              onSelect={setSelectedAgentId}
              onRegister={registerAgent}
            />
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <h2>Post a task</h2>
            <p className="mono" style={{ margin: "0 0 8px" }}>
              Bidding from: {selected?.name ?? "—"}
              {capabilityFilter ? ` · prefer “${capabilityFilter}”` : ""}
            </p>
            <TaskForm onSubmit={broadcastTask} />
          </section>

          <section className="panel">
            <h2>Tasks</h2>
            <TaskList
              tasks={tasks}
              agents={agents}
              onAward={award}
              onSettle={settle}
            />
          </section>

          <section className="panel">
            <h2>Settlement ledger</h2>
            <Ledger entries={ledger} />
          </section>
        </div>
      </main>
    </div>
  );
}
