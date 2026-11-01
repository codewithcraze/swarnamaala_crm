import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { api } from "../api.js";
import {
  PageHeader,
  TableSkeleton,
  RS,
  SourceChip,
  sourceLabel,
  sourceColor,
  MANUAL_SOURCES,
  PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../components/ui.jsx";
import { useAgents, AgentSelect, assignAgent } from "../components/agents.jsx";
import ManualOrderDialog from "../components/ManualOrderDialog.jsx";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];
const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function fileSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : url;
}

export default function ManualOrders() {
  const navigate = useNavigate();
  const { agents } = useAgents();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [agent, setAgent] = useState("");
  const [entry, setEntry] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page + 1), limit: String(rowsPerPage) });
    if (source) p.set("source", source);
    if (status) p.set("status", status);
    if (agent) p.set("agent", agent);
    if (entry) p.set("entry", entry);
    if (searchDebounced) p.set("search", searchDebounced);
    api(`/api/manual-orders?${p}`)
      .then((d) => {
        setOrders(d.orders);
        setTotal(d.total);
        setCounts(d.sourceCounts || {});
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, source, status, agent, entry, searchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  // Fixed tabs, plus any other platform that has orders (e.g. WhatsApp from
  // the send-photos page).
  const tabSources = [...MANUAL_SOURCES, ...Object.keys(counts).filter((s) => s && !MANUAL_SOURCES.includes(s))];
  const allCount = Object.values(counts).reduce((n, c) => n + c, 0);

  function patchRow(id, changes) {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...changes } : o)));
  }

  async function update(id, path, body, changes) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/${path}`, { method: "PATCH", body: JSON.stringify(body) });
      patchRow(id, changes);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function updateAgent(id, agentId) {
    setBusyId(id);
    try {
      const d = await assignAgent(id, agentId);
      patchRow(id, { agent: d.agent ? { _id: agentId, name: d.agent.name } : null });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/api/orders/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setToast("Order deleted.");
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const filterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Marketplace orders"
        subtitle="Meesho, Flipkart, Amazon and Self orders: sent by customers through the send-photos page or added here by hand. Kept separate from the main Orders list."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add order
          </Button>
        }
      />

      <Tabs
        value={source}
        onChange={(_e, v) => {
          setSource(v);
          setPage(0);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="" label={`All (${allCount})`} />
        {tabSources.map((s) => (
          <Tab
            key={s}
            value={s}
            label={`${sourceLabel(s)} (${counts[s] || 0})`}
            sx={{ "&.Mui-selected": { color: sourceColor(s) } }}
          />
        ))}
      </Tabs>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: "center" } }}>
        <TextField
          size="small"
          label="Search name, phone or order ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <TextField select size="small" label="Status" value={status} onChange={filterChange(setStatus)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Added by" value={entry} onChange={filterChange(setEntry)} sx={{ minWidth: 170 }}>
          <MenuItem value="">Everyone</MenuItem>
          <MenuItem value="photo-link">Customer (send-photos)</MenuItem>
          <MenuItem value="manual">Admin (manual)</MenuItem>
        </TextField>
        <TextField select size="small" label="Agent" value={agent} onChange={filterChange(setAgent)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All agents</MenuItem>
          <MenuItem value="none">No agent</MenuItem>
          {agents.map((a) => (
            <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={load}
          disabled={loading}
          sx={{ borderColor: "divider", color: "text.secondary" }}
        >
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell>Source / order ID</TableCell>
                <TableCell>Photos</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Label</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={6} cols={11} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No orders here yet. Use “Add order” to create one.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow
                    key={o._id}
                    hover
                    sx={{ "& > td:first-of-type": { boxShadow: `inset 4px 0 0 ${sourceColor(o.source)}` } }}
                  >
                    <TableCell>
                      <SourceChip source={o.source} />
                      {o.externalOrderId && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontFamily: "monospace", fontWeight: 600 }}>
                          {o.externalOrderId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Avatar
                        variant="rounded"
                        src={fileSrc(o.images?.[0]) || undefined}
                        sx={{ width: 40, height: 40, fontSize: 13, bgcolor: "action.hover", color: "text.secondary" }}
                      >
                        {o.images?.length || 0}
                      </Avatar>
                      {o.images?.length > 1 && (
                        <Typography variant="caption" color="text.secondary">+{o.images.length - 1}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.customerName || o.user?.name || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {o.customerPhone || o.user?.phone || o.shippingAddress?.phone}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {o.entry === "manual" ? "Added manually" : "Sent via send-photos"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <AgentSelect
                        agents={agents}
                        value={o.agent?._id || o.agent || ""}
                        disabled={busyId === o._id}
                        onChange={(id) => updateAgent(o._id, id)}
                        label=""
                        sx={{ minWidth: 130, "& .MuiInputBase-root": { fontSize: 12, height: 30 } }}
                      />
                    </TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>{o.total > 0 ? `${RS}${o.total}` : "—"}</TableCell>
                    <TableCell>
                      {o.labelUrl ? (
                        <Tooltip title="Open label PDF">
                          <IconButton size="small" color="error" component="a" href={fileSrc(o.labelUrl)} target="_blank" rel="noreferrer">
                            <PictureAsPdfOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={o.paymentStatus || "unpaid"}
                        disabled={busyId === o._id}
                        onChange={(e) => update(o._id, "payment", { paymentStatus: e.target.value }, { paymentStatus: e.target.value })}
                        sx={{ fontSize: 12, height: 30, textTransform: "capitalize" }}
                      >
                        {PAYMENTS.map((p) => (
                          <MenuItem key={p} value={p} sx={{ textTransform: "capitalize" }}>{p}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={o.status || "pending"}
                        disabled={busyId === o._id}
                        onChange={(e) => update(o._id, "status", { status: e.target.value }, { status: e.target.value })}
                        sx={{ fontSize: 12, height: 30, textTransform: "capitalize" }}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View order">
                          <IconButton component={RouterLink} to={`/orders/${o._id}`} size="small" color="secondary">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete order">
                          <IconButton size="small" color="error" disabled={busyId === o._id} onClick={() => setDeleteTarget(o)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        />
      </Card>

      <ManualOrderDialog
        open={addOpen}
        agents={agents}
        onClose={() => setAddOpen(false)}
        onCreated={(o) => {
          setAddOpen(false);
          navigate(`/orders/${o._id}`);
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The {sourceLabel(deleteTarget?.source)} order {deleteTarget?.externalOrderId ? <b>{deleteTarget.externalOrderId}</b> : ""} for{" "}
            <b>{deleteTarget?.customerName || deleteTarget?.user?.name || "this customer"}</b> will be permanently deleted, with its{" "}
            {deleteTarget?.images?.length || 0} photo{deleteTarget?.images?.length === 1 ? "" : "s"}
            {deleteTarget?.labelUrl ? " and label PDF" : ""}. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast("")} message={toast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </Box>
  );
}
