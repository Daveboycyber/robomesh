import type { Agent, Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  agents: Agent[];
  onAward: (taskId: string, agentId: string) => void;
  onSettle: (taskId: string) => void;
}

export function TaskList({ tasks, agents, onAward, onSettle }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet. Broadcast one to the mesh.</p>;
  }

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="stack">
      {tasks.map((t) => (
        <div className="card" key={t.id}>
          <div className="row">
            <div>
              <p className="card-title">{t.title}</p>
              <p className="mono">
                {t.requester} · {t.amount.toFixed(2)} π ·{" "}
                <span className={`status-pill ${t.status}`}>{t.status}</span>
              </p>
            </div>
          </div>

          {t.status === "open" &&
            t.bids.map((bid) => (
              <div className="row" style={{ marginTop: 8 }} key={bid.agentId}>
                <span className="mono">
                  {agentName(bid.agentId)} · {bid.amount.toFixed(2)} π · {bid.eta}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onAward(t.id, bid.agentId)}
                >
                  Award
                </button>
              </div>
            ))}

          {(t.status === "working" || t.status === "awarded") && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ width: "auto", marginTop: 10 }}
              onClick={() => onSettle(t.id)}
            >
              Settle in π
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
