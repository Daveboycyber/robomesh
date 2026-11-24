import { FormEvent, useState } from "react";
import type { Agent, Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  agents: Agent[];
  settlingId?: string | null;
  onAward: (taskId: string, agentId: string) => void;
  onSettle: (taskId: string) => void;
  onRequestBetter: (taskId: string) => void;
  onCounter: (taskId: string, maxAmount: number) => void;
  onCancel: (taskId: string) => void;
}

export function TaskList({
  tasks,
  agents,
  settlingId,
  onAward,
  onSettle,
  onRequestBetter,
  onCounter,
  onCancel,
}: TaskListProps) {
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  if (tasks.length === 0) {
    return <p className="empty">No tasks yet. Broadcast one to the mesh.</p>;
  }

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  function submitCounter(e: FormEvent, taskId: string) {
    e.preventDefault();
    const n = Number(counterValue);
    if (!(n > 0)) return;
    onCounter(taskId, n);
    setCounterFor(null);
    setCounterValue("");
  }

  const negotiable = (status: Task["status"]) =>
    status === "open" || status === "negotiating";

  return (
    <div className="stack">
      {tasks.map((t) => {
        const activeBids = t.bids.filter((b) => b.active);
        const showHistory = expandedHistory[t.id];

        return (
          <div className="card" key={t.id}>
            <div className="row">
              <div>
                <p className="card-title">{t.title}</p>
                <p className="mono">
                  {t.requester} · budget {t.amount.toFixed(2)} π
                  {t.counterAmount != null
                    ? ` · counter ≤ ${t.counterAmount.toFixed(2)} π`
                    : ""}
                  {" · "}
                  <span className={`status-pill ${t.status}`}>{t.status}</span>
                  {" · r"}
                  {t.round}
                </p>
              </div>
            </div>

            {negotiable(t.status) && (
              <div style={{ marginTop: 10 }}>
                {activeBids.length === 0 ? (
                  <p className="empty" style={{ padding: "4px 0" }}>
                    Waiting for bids…
                  </p>
                ) : (
                  activeBids.map((bid) => (
                    <div className="row" style={{ marginTop: 8 }} key={`${bid.agentId}-${bid.round}`}>
                      <span className="mono">
                        {agentName(bid.agentId)} · {bid.amount.toFixed(2)} π · {bid.eta}
                        {" · r"}
                        {bid.round}
                        {bid.note ? ` · ${bid.note}` : ""}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onAward(t.id, bid.agentId)}
                      >
                        Award
                      </button>
                    </div>
                  ))
                )}

                <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRequestBetter(t.id)}
                    disabled={t.round >= 5}
                  >
                    Request better terms
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setCounterFor(counterFor === t.id ? null : t.id);
                      setCounterValue(
                        t.counterAmount?.toFixed(2) ??
                          (activeBids.length
                            ? Math.min(...activeBids.map((b) => b.amount)).toFixed(2)
                            : t.amount.toFixed(2))
                      );
                    }}
                  >
                    Counter-offer
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onCancel(t.id)}
                  >
                    Cancel
                  </button>
                </div>

                {counterFor === t.id && (
                  <form
                    onSubmit={(e) => submitCounter(e, t.id)}
                    className="row"
                    style={{ marginTop: 10, gap: 8 }}
                  >
                    <label className="field" style={{ margin: 0, flex: 1 }}>
                      Max you will pay (π)
                      <input
                        value={counterValue}
                        onChange={(e) => setCounterValue(e.target.value)}
                        inputMode="decimal"
                      />
                    </label>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ width: "auto", alignSelf: "end" }}>
                      Send counter
                    </button>
                  </form>
                )}
              </div>
            )}

            {(t.status === "working" || t.status === "awarded") && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: "auto", marginTop: 10 }}
                disabled={settlingId === t.id}
                onClick={() => onSettle(t.id)}
              >
                {settlingId === t.id ? "Waiting for Pi…" : `Settle ${t.amount.toFixed(2)} π`}
              </button>
            )}

            {t.history?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setExpandedHistory((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                  }
                >
                  {showHistory ? "Hide" : "Show"} negotiation log ({t.history.length})
                </button>
                {showHistory && (
                  <ul className="nego-log">
                    {[...t.history]
                      .slice()
                      .reverse()
                      .map((ev) => (
                        <li key={ev.id}>
                          <span className="mono">
                            r{ev.round} · {ev.type}
                          </span>
                          <span>{ev.message}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
