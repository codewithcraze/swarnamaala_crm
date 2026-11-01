import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Link,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { api } from "../api.js";
import { PageHeader, TableSkeleton, RS, usePaged, ListPagination } from "../components/ui.jsx";
import { useAgents } from "../components/agents.jsx";
import AgentDialog from "../components/AgentDialog.jsx";

export default function Agents() {
  const { agents, unassigned, loading, error, reload } = useAgents();
  const [dialog, setDialog] = useState({ open: false, agent: null });
  const [toast, setToast] = useState("");
  const paged = usePaged(agents);

  async function remove(a) {
    const n = a.stats?.orders || 0;
    if (!window.confirm(`Delete ${a.name}?${n ? ` Their ${n} order${n === 1 ? "" : "s"} will be kept but show no agent.` : ""}`)) return;
    try {
      await api(`/api/agents/${a._id}`, { method: "DELETE" });
      setToast(`${a.name} deleted.`);
      reload();
    } catch (e) {
      setToast(e.message);
    }
  }

  const totalOrders = agents.reduce((n, a) => n + (a.stats?.orders || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Agents"
        subtitle={`${agents.length} agent${agents.length === 1 ? "" : "s"} · ${totalOrders} orders assigned · ${unassigned} without an agent`}
        action={
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setDialog({ open: true, agent: null })}>
            Add agent
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Delivered</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && agents.length === 0 ? (
                <TableSkeleton rows={4} cols={8} />
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No agents yet. Register your first agent to start tracking who took each order.
                    </Typography>
                    <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setDialog({ open: true, agent: null })}>
                      Add agent
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paged.rows.map((a) => (
                  <TableRow key={a._id} hover sx={{ opacity: a.active === false ? 0.6 : 1 }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography>
                      {a.notes && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 260 }} noWrap title={a.notes}>
                          {a.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{a.phone || "—"}</Typography>
                      {a.email && <Typography variant="caption" color="text.secondary">{a.email}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Link component={RouterLink} to={`/orders?agent=${a._id}`} sx={{ fontWeight: 700 }}>
                        {a.stats?.orders ?? 0}
                      </Link>
                    </TableCell>
                    <TableCell align="right">{a.stats?.paid ?? 0}</TableCell>
                    <TableCell align="right">{a.stats?.delivered ?? 0}</TableCell>
                    <TableCell align="right">{RS}{Math.round(a.stats?.revenue ?? 0)}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={a.active === false ? "default" : "success"} label={a.active === false ? "Inactive" : "Active"} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setDialog({ open: true, agent: a })}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(a)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {agents.length > 0 && <ListPagination {...paged.paginationProps} />}
      </Card>

      <AgentDialog
        open={dialog.open}
        agent={dialog.agent}
        onClose={() => setDialog({ open: false, agent: null })}
        onSaved={(a) => {
          setToast(dialog.agent ? "Agent updated." : `${a.name} registered.`);
          setDialog({ open: false, agent: null });
          reload();
        }}
      />
      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}
