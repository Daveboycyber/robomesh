import { FormEvent, useMemo, useState } from "react";
import type { Agent } from "@/types";

const SUGGESTED_CAPS = [
  "lift",
  "navigate-indoor",
  "navigate-outdoor",
  "aerial",
  "pallet",
  "package",
  "inspect",
  "assemble",
  "mapping",
  "heavy-lift",
  "multispectral",
  "doorstep",
];

interface AgentRegistryProps {
  agents: Agent[];
  selectedId: string | null;
  capabilityFilter: string;
  onFilterChange: (cap: string) => void;
  onSelect: (id: string) => void;
  onRegister: (agent: Omit<Agent, "id" | "x" | "y" | "status" | "reputation">) => void;
}

export function AgentRegistry({
  agents,
  selectedId,
  capabilityFilter,
  onFilterChange,
  onSelect,
  onRegister,
}: AgentRegistryProps) {
  const [name, setName] = useState("");
  const [maker, setMaker] = useState("");
  const [role, setRole] = useState("");
  const [capsInput, setCapsInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  const allCaps = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => a.capabilities.forEach((c) => set.add(c)));
    SUGGESTED_CAPS.forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [agents]);

  const filtered = useMemo(() => {
    if (!capabilityFilter.trim()) return agents;
    const q = capabilityFilter.trim().toLowerCase();
    return agents.filter((a) =>
      a.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  }, [agents, capabilityFilter]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !maker.trim() || !role.trim()) return;
    const capabilities = capsInput
      .split(/[,\s]+/)
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    onRegister({
      name: name.trim(),
      maker: maker.trim(),
      role: role.trim(),
      capabilities: capabilities.length ? capabilities : ["general"],
    });
    setName("");
    setMaker("");
    setRole("");
    setCapsInput("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <label className="field" style={{ margin: 0, flex: 1 }}>
          Discover by capability
          <input
            value={capabilityFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="e.g. aerial, pallet, lift"
            list="cap-suggestions"
          />
          <datalist id="cap-suggestions">
            {allCaps.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      {capabilityFilter && (
        <p className="mono" style={{ margin: "0 0 8px" }}>
          {filtered.length} agent{filtered.length === 1 ? "" : "s"} match “{capabilityFilter}”
          {" · "}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 24, padding: "0 6px" }}
            onClick={() => onFilterChange("")}
          >
            Clear
          </button>
        </p>
      )}

      <div className="cap-chips">
        {allCaps.slice(0, 12).map((c) => (
          <button
            key={c}
            type="button"
            className={`cap-chip${capabilityFilter === c ? " on" : ""}`}
            onClick={() => onFilterChange(capabilityFilter === c ? "" : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="registry-list">
        {filtered.length === 0 ? (
          <p className="empty">No agents match this capability.</p>
        ) : (
          filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`registry-item${a.id === selectedId ? " on" : ""}`}
              onClick={() => onSelect(a.id)}
            >
              <div className="row">
                <strong>{a.name}</strong>
                <span className={`status-pill ${a.status === "idle" ? "" : a.status}`}>
                  {a.status}
                </span>
              </div>
              <p className="mono" style={{ margin: "4px 0 0" }}>
                {a.maker} · {a.role}
                {a.reputation != null ? ` · ★ ${a.reputation.toFixed(1)}` : ""}
              </p>
              <div className="cap-chips" style={{ marginTop: 6 }}>
                {a.capabilities.map((c) => (
                  <span key={c} className="cap-chip static">
                    {c}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>

      {!showForm ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => setShowForm(true)}
        >
          Register agent
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <label className="field">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Atlas-8" required />
          </label>
          <label className="field">
            Manufacturer
            <input value={maker} onChange={(e) => setMaker(e.target.value)} placeholder="Northline" required />
          </label>
          <label className="field">
            Role
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Warehouse mover" required />
          </label>
          <label className="field">
            Capabilities (comma-separated)
            <input
              value={capsInput}
              onChange={(e) => setCapsInput(e.target.value)}
              placeholder="lift, navigate-indoor, pallet"
              list="cap-suggestions"
            />
          </label>
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Add to mesh
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
