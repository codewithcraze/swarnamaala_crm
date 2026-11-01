import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { api } from "../api.js";
import { RS } from "./ui.jsx";
import { useAgents } from "./agents.jsx";
import AgentDialog from "./AgentDialog.jsx";

// Dashboard section: add agents and see how many orders each one brought in.
export default function AgentsPanel() {
  const { agents, unassigned, loading, error, reload } = useAgents();
  const [dialog, setDialog] = useState({ open: false, agent: null });
  const [menu, setMenu] = useState(null); // { el, agent }

  async function toggleActive(agent) {
    try {
      await api(`/api/agents/${agent._id}`, { method: "PATCH", body: JSON.stringify({ active: agent.active === false }) });
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(agent) {
    const n = agent.stats?.orders || 0;
    if (!window.confirm(`Delete ${agent.name}?${n ? ` Their ${n} order${n === 1 ? "" : "s"} will be kept but show no agent.` : ""}`)) return;
    try {
      await api(`/api/agents/${agent._id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mt: 4, mb: 1.5 }}>
        <Typography variant="h6">Orders by agent</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" component={RouterLink} to="/agents">
            Manage agents
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, agent: null })}>
            Add agent
          </Button>
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading && agents.length === 0 ? (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={110} />)}
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          {agents.map((a) => (
            <Card key={a._id} sx={{ position: "relative", opacity: a.active === false ? 0.6 : 1 }}>
              <CardContent component={RouterLink} to={`/orders?agent=${a._id}`} sx={{ display: "block", textDecoration: "none", color: "inherit", pr: 5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={a.name}>
                  {a.name}
                </Typography>
                {a.phone && (
                  <Typography variant="caption" color="text.secondary" display="block">{a.phone}</Typography>
                )}
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {a.stats?.orders ?? 0}
                  <Typography component="span" variant="body2" color="text.secondary"> orders</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.stats?.paid ?? 0} paid · {a.stats?.delivered ?? 0} delivered · {RS}{Math.round(a.stats?.revenue ?? 0)}
                </Typography>
                {a.active === false && <Chip size="small" label="Inactive" sx={{ mt: 1, display: "flex", width: "fit-content" }} />}
              </CardContent>
              <IconButton size="small" sx={{ position: "absolute", top: 8, right: 8 }} onClick={(e) => setMenu({ el: e.currentTarget, agent: a })}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Card>
          ))}
          <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
            <CardContent component={RouterLink} to="/orders?agent=none" sx={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <Typography variant="body2" color="text.secondary">No agent</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{unassigned}</Typography>
              <Typography variant="caption" color="text.secondary">Orders not assigned yet</Typography>
            </CardContent>
          </Card>
        </Box>
      )}
      {!loading && agents.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No agents yet. Click <b>Add agent</b> to register one, then pick the agent on each order (in the orders list or the order page).
        </Typography>
      )}

      <Menu anchorEl={menu?.el} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setDialog({ open: true, agent: menu.agent }); setMenu(null); }}>Edit details</MenuItem>
        <MenuItem onClick={() => { toggleActive(menu.agent); setMenu(null); }}>
          {menu?.agent?.active === false ? "Mark active" : "Mark inactive"}
        </MenuItem>
        <MenuItem sx={{ color: "error.main" }} onClick={() => { remove(menu.agent); setMenu(null); }}>Delete</MenuItem>
      </Menu>

      <AgentDialog
        open={dialog.open}
        agent={dialog.agent}
        onClose={() => setDialog({ open: false, agent: null })}
        onSaved={() => {
          setDialog({ open: false, agent: null });
          reload();
        }}
      />
    </Box>
  );
}
