import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { api } from "../api.js";

function when(d) {
  return d ? new Date(d).toLocaleString() : "";
}

// Internal admin notes for an order: add as many as needed, newest first.
export default function OrderNotes({ orderId, notes, onChange }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  async function add() {
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    try {
      const d = await api(`/api/orders/${orderId}/notes`, { method: "POST", body: JSON.stringify({ text: t }) });
      onChange(d.adminNotes);
      setText("");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this note?")) return;
    setRemoving(id);
    try {
      const d = await api(`/api/orders/${orderId}/notes/${id}`, { method: "DELETE" });
      onChange(d.adminNotes);
    } catch (e) {
      alert(e.message);
    } finally {
      setRemoving(null);
    }
  }

  const list = [...(notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Box>
      <TextField
        multiline
        minRows={2}
        fullWidth
        size="small"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) add();
        }}
        placeholder="Add a private note (not visible to the customer)…"
        sx={{ mt: 1.5 }}
      />
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
        <Button variant="contained" size="small" onClick={add} disabled={saving || !text.trim()}>
          {saving ? "Adding…" : "Add note"}
        </Button>
        <Typography variant="caption" color="text.secondary">Ctrl + Enter</Typography>
      </Stack>

      {list.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No notes yet.</Typography>
      ) : (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {list.map((n) => (
            <Box
              key={n._id}
              sx={{ p: 1.25, pr: 0.5, borderRadius: 1.5, bgcolor: "action.hover", display: "flex", gap: 1, alignItems: "flex-start" }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{n.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.author || "Earlier note"} · {when(n.createdAt)}
                </Typography>
              </Box>
              <Tooltip title="Delete note">
                <span>
                  <IconButton size="small" onClick={() => remove(n._id)} disabled={removing === n._id}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
