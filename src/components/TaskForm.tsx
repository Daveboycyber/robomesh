import { FormEvent, useState } from "react";

interface TaskFormProps {
  onSubmit: (title: string, amount: number) => void;
  disabled?: boolean;
}

export function TaskForm({ onSubmit, disabled }: TaskFormProps) {
  const [title, setTitle] = useState("Relay crate to dock 2");
  const [amount, setAmount] = useState("0.8");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!title.trim() || !(n > 0)) return;
    onSubmit(title.trim(), n);
  }

  return (
    <form id="task-form" onSubmit={handleSubmit}>
      <label className="field">
        What needs doing
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Describe the task"
          disabled={disabled}
        />
      </label>
      <label className="field">
        Offer (π)
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={disabled} style={{ marginTop: 12 }}>
        Broadcast to mesh
      </button>
    </form>
  );
}
