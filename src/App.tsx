import { useCallback, useMemo, useState } from "react";
import { MeshView } from "@/components/MeshView";
import { AgentRegistry } from "@/components/AgentRegistry";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Ledger } from "@/components/Ledger";
import { seedAgents, seedTasks, seedLedger } from "@/data/seed";
import { authenticatePi } from "@/lib/pi";
import type {
  Agent,
  Bid,
  LedgerEntry,
  NegotiationEvent,
  Operator,
  Task,
} from "@/types";

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

function randomMeshPoint(): { x: number; y: number } {
  return {
    x: 12 + Math.random() * 76,
    y: 14 + Math.random() * 72,
  };
}

function event(
  type: NegotiationEvent["type"],
  message: string,
  round: number
): NegotiationEvent {
  return { id: uid("h"), at: Date.now(), type, message, round };
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(() => seedAgents.map((a) => ({ ...a })));
  const [tasks, setTasks] = useState<Task[]>(() =>
    seedTasks.map((t) => ({
      ...t,
      bids: t.bids.map((b) => ({ ...b })),
      history: t.history.map((h) => ({ ...h })),
    }))
  );
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

      const bids: Bid[] = candidates.map((a, i) => ({
        agentId: a.id,
        amount: Math.max(0.05, +(amount * (0.72 + i * 0.1)).toFixed(2)),
        eta: `${3 + i * 3} min`,
        round: 1,
        active: true,
        note: "initial",
      }));

      const history: NegotiationEvent[] = [
        event("opened", `Task opened at ${amount.toFixed(2)} π`, 1),
        ...bids.map((b) =>
          event(
            "bid",
            `${agents.find((x) => x.id === b.agentId)?.name ?? b.agentId} bid ${b.amount.toFixed(2)} π · ${b.eta}`,
            1
          )
        ),
      ];

      const task: Task = {
        id: uid("t"),
        title,
        requester: selected.name,
        requesterId: selected.id,
        amount,
        status: "open",
        bids,
        round: 1,
        history,
        createdAt: Date.now(),
      };

      setTasks((prev) => [task, ...prev]);
    },
    [agents, selected, capabilityFilter]
  );

  const requestBetter = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId || (t.status !== "open" && t.status !== "negotiating"))
            return t;
          if (t.round >= 5) return t;

          const nextRound = t.round + 1;
          const previousActive = t.bids.filter((b) => b.active);

          // Deactivate old bids and issue revised ones (~8–15% lower, slightly faster ETA)
          const revised: Bid[] = previousActive.map((b, i) => {
            const cut = 0.08 + i * 0.02 + Math.random() * 0.03;
            const newAmount = Math.max(0.05, +(b.amount * (1 - cut)).toFixed(2));
            const etaNum = Math.max(2, parseInt(b.eta, 10) - 1);
            return {
              agentId: b.agentId,
              amount: newAmount,
              eta: `${etaNum} min`,
              round: nextRound,
              active: true,
              note: "revised",
            };
          });

          const hist: NegotiationEvent[] = [
            ...t.history,
            event("revise", `Requester asked for better terms → round ${nextRound}`, nextRound),
            ...revised.map((b) =>
              event(
                "bid",
                `${agents.find((x) => x.id === b.agentId)?.name ?? b.agentId} revised to ${b.amount.toFixed(2)} π · ${b.eta}`,
                nextRound
              )
            ),
          ];

          return {
            ...t,
            status: "negotiating" as const,
            round: nextRound,
            bids: [
              ...t.bids.map((b) => ({ ...b, active: false })),
              ...revised,
            ],
            history: hist,
          };
        })
      );
    },
    [agents]
  );

  const counterOffer = useCallback(
    (taskId: string, maxAmount: number) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId || (t.status !== "open" && t.status !== "negotiating"))
            return t;

          const nextRound = t.round + 1;
          const previousActive = t.bids.filter((b) => b.active);

          const revised: Bid[] = previousActive.map((b) => {
            // Meet the counter if possible, else drop out
            if (b.amount <= maxAmount) {
              return {
                ...b,
                round: nextRound,
                active: true,
                note: "accepts counter",
              };
            }
            // Try to meet halfway toward counter
            const meet = Math.max(0.05, +((b.amount + maxAmount) / 2).toFixed(2));
            if (meet <= maxAmount * 1.05) {
              return {
                agentId: b.agentId,
                amount: Math.min(meet, maxAmount),
                eta: b.eta,
                round: nextRound,
                active: true,
                note: "matched counter",
              };
            }
            return {
              agentId: b.agentId,
              amount: b.amount,
              eta: b.eta,
              round: nextRound,
              active: false,
              note: "withdrew",
            };
          });

          const stillIn = revised.filter((b) => b.active);
          const hist: NegotiationEvent[] = [
            ...t.history,
            event(
              "counter",
              `Requester counter-offer ≤ ${maxAmount.toFixed(2)} π → round ${nextRound}`,
              nextRound
            ),
            ...revised.map((b) =>
              event(
                b.active ? "bid" : "revise",
                `${agents.find((x) => x.id === b.agentId)?.name ?? b.agentId} ${
                  b.active
                    ? `offers ${b.amount.toFixed(2)} π (${b.note})`
                    : "withdrew"
                }`,
                nextRound
              )
            ),
          ];

          return {
            ...t,
            status: stillIn.length ? ("negotiating" as const) : ("cancelled" as const),
            counterAmount: maxAmount,
            round: nextRound,
            bids: [...t.bids.map((b) => ({ ...b, active: false })), ...revised],
            history: hist,
          };
        })
      );
    },
    [agents]
  );

  const cancelTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.status === "settled" || t.status === "working") return t;
        return {
          ...t,
          status: "cancelled" as const,
          bids: t.bids.map((b) => ({ ...b, active: false })),
          history: [
            ...t.history,
            event("cancel", "Task cancelled by requester", t.round),
          ],
        };
      })
    );
    // Free negotiating agents that only work this task — simplified: set negotiating→idle if no other open tasks
    setAgents((prev) =>
      prev.map((a) => (a.status === "negotiating" ? { ...a, status: "idle" as const } : a))
    );
  }, []);

  const award = useCallback((taskId: string, agentId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const bid = t.bids.find((b) => b.agentId === agentId && b.active);
        return {
          ...t,
          status: "working" as const,
          awardedTo: agentId,
          amount: bid?.amount ?? t.amount,
          bids: t.bids.map((b) => ({ ...b, active: false })),
          history: [
            ...t.history,
            event("award", `Awarded to agent ${agentId} at ${(bid?.amount ?? t.amount).toFixed(2)} π`, t.round),
          ],
        };
      })
    );
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) return { ...a, status: "working" as const };
        if (a.status === "negotiating") return { ...a, status: "idle" as const };
        return a;
      })
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
    setTasks(
      seedTasks.map((t) => ({
        ...t,
        bids: t.bids.map((b) => ({ ...b })),
        history: t.history.map((h) => ({ ...h })),
      }))
    );
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
        Multi-round negotiation is live. Request better terms, send counter-offers, or award a bid.
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
            <h2>Tasks & negotiation</h2>
            <TaskList
              tasks={tasks}
              agents={agents}
              onAward={award}
              onSettle={settle}
              onRequestBetter={requestBetter}
              onCounter={counterOffer}
              onCancel={cancelTask}
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
