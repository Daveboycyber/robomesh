import type { Agent } from "@/types";

interface MeshViewProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MeshView({ agents, selectedId, onSelect }: MeshViewProps) {
  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  return (
    <div>
      <p className="mesh-caption">
        {selected
          ? `Selected: ${selected.name} · ${selected.maker} · ${selected.role}`
          : "Select an agent"}
      </p>
      <div className="mesh" role="group" aria-label="Agent mesh">
        <svg
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          aria-hidden
        >
          {agents.map((a, i) => {
            const b = agents[(i + 2) % agents.length];
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2a2e36"
                strokeWidth="0.4"
              />
            );
          })}
        </svg>
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`mesh-node${a.id === selectedId ? " on" : ""}`}
            style={{ left: `${a.x}%`, top: `${a.y}%` }}
            onClick={() => onSelect(a.id)}
          >
            {a.name}
            <small>{a.status}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
