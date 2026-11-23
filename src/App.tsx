import { useCallback, useMemo, useState } from "react";
import { MeshView } from "@/components/MeshView";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Ledger } from "@/components/Ledger";
import { seedAgents, seedTasks, seedLedger } from "@/data/seed";
import { authenticatePi } from "@/lib/pi";
import type { Agent, LedgerEntry, Operator, Task } from "@/types";

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(() => seedAgents.map((a) => ({ ...a })));
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks.map((t) => ({ ...t, bids: [...t.bids] })));
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => [...seedLedger]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("atlas");
  const [operator, setOperator] = useState<Operator | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

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

  const broadcastTask = useCallback(
    (title: string, amount: number) => {
      if (!selected) return;
      const others = agents.filter((a) => a.id !== selected.id).slice(0, 2);

      setAgents((prev) =>
        prev.map((a) =>
          others.some((o) => o.id === a.id) ? { ...a, status: "negotiating" as const } : a
        )
      );

      const bids = others.map((a, i) => ({
        agentId: a.id,
        amount: Math.max(0.05, +(amount * (0.75 + i * 0.12)).toFixed(2)),
        eta: `${4 + i * 3} min`,
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
    [agents, selected]
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
          ? `Signed in as @${operator.username}. Broadcast tasks, award bids, settle in π.`
          : "Sign in with Pi to operate the mesh. Agents discover, negotiate, and settle value."}
      </p>

      <main className="main">
        <section className="panel">
          <h2>Live mesh</h2>
          <MeshView
            agents={agents}
            selectedId={selectedAgentId}
            onSelect={setSelectedAgentId}
          />
        </section>

        <div className="stack">
          <section className="panel">
            <h2>Post a task</h2>
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
