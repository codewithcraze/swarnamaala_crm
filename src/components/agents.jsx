import { useCallback, useEffect, useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import { api } from "../api.js";

// Loads the agent list (with order counts). `reload` refreshes it.
export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [unassigned, setUnassigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    return api("/api/agents")
      .then((d) => {
        setAgents(d.agents || []);
        setUnassigned(d.unassigned || 0);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { agents, setAgents, unassigned, loading, error, reload };
}

export async function assignAgent(orderId, agentId) {
  return api(`/api/orders/${orderId}/agent`, {
    method: "PATCH",
    body: JSON.stringify({ agentId: agentId || null }),
  });
}

// Dropdown to pick the agent for an order. Inactive agents stay selectable
// only if already assigned, so old orders still show the right name.
export function AgentSelect({ agents, value, onChange, disabled, size = "small", label = "Agent", sx }) {
  const current = value || "";
  const options = agents.filter((a) => a.active !== false || String(a._id) === String(current));
  return (
    <TextField
      select
      size={size}
      label={label}
      value={options.some((a) => String(a._id) === String(current)) ? current : ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      SelectProps={{ displayEmpty: true }}
      InputLabelProps={label ? { shrink: true } : undefined}
      sx={{ minWidth: 150, ...sx }}
    >
      <MenuItem value="">
        <em>No agent</em>
      </MenuItem>
      {options.map((a) => (
        <MenuItem key={a._id} value={a._id}>
          {a.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
