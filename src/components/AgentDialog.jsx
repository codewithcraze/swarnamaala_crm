import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { api } from "../api.js";

const EMPTY = { name: "", phone: "", email: "", notes: "", active: true };

// Register a new agent (agent = null) or edit an existing one.
export default function AgentDialog({ open, agent, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = !!agent?._id;

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      agent
        ? { name: agent.name || "", phone: agent.phone || "", email: agent.email || "", notes: agent.notes || "", active: agent.active !== false }
        : EMPTY
    );
  }, [open, agent]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e?.preventDefault();
    if (!form.name.trim()) {
      setError("Enter the agent's name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const d = await api(editing ? `/api/agents/${agent._id}` : "/api/agents", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      onSaved(d.agent);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <form onSubmit={save}>
        <DialogTitle>{editing ? "Edit agent" : "Register a new agent"}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField autoFocus required size="small" label="Full name" value={form.name} onChange={set("name")} />
            <TextField size="small" label="Phone" value={form.phone} onChange={set("phone")} inputProps={{ inputMode: "tel" }} />
            <TextField size="small" type="email" label="Email" value={form.email} onChange={set("email")} />
            <TextField size="small" label="Notes" placeholder="e.g. handles Instagram orders" multiline minRows={2} value={form.notes} onChange={set("notes")} />
            {editing && (
              <FormControlLabel
                control={<Switch checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />}
                label="Active (can be picked on new orders)"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {editing ? "Save" : "Register agent"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
