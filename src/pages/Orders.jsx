import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Avatar,
  Typography,
  Select,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { api } from "../api.js";
import { PageHeader, StatusChip, PaymentChip, TableSkeleton, RS } from "../components/ui.jsx";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];
const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function imageSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : null;
}

function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // zero-based for MUI
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filter, setFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // order pending deletion
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page + 1));
    params.set("limit", String(rowsPerPage));
    if (filter) params.set("status", filter);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    api(`/api/orders?${params.toString()}`)
      .then((d) => {
        setOrders(d.orders);
        setTotal(d.total ?? d.orders.length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, filter, paymentFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function updatePayment(id, paymentStatus) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, paymentStatus } : o)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/orders/${deleteTarget._id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o._id !== deleteTarget._id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(0); // reset to first page when filters change
    };
  }

  return (
    <Box>
      <PageHeader
        title="Orders"
        subtitle="Manage orders. Marking an order delivered credits the referrer's wallet."
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { sm: "center" } }}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={filter}
          onChange={changeFilter(setFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Payment"
          value={paymentFilter}
          onChange={changeFilter(setPaymentFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All payments</MenuItem>
          {PAYMENTS.map((p) => (
            <MenuItem key={p} value={p} sx={{ textTransform: "capitalize" }}>
              {p}
            </MenuItem>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer sx={{ maxWidth: "100%" }}>
          <Table sx={{ minWidth: 980 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Photos</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Ship to</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Referral</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={rowsPerPage > 10 ? 8 : rowsPerPage} cols={9} />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const thumb = imageSrc(o.images?.[0]);
                  return (
                    <TableRow key={o._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Avatar
                            variant="rounded"
                            src={thumb || undefined}
                            sx={{ width: 40, height: 40, fontSize: 13, bgcolor: "action.hover", color: "text.secondary" }}
                          >
                            {o.images?.length || 0}
                          </Avatar>
                          {o.images?.length > 1 && (
                            <Typography variant="caption" color="text.secondary">
                              +{o.images.length - 1}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {o.user?.name || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {o.user?.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.shippingAddress?.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.unitLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty {o.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {RS}
                          {o.total ?? o.amount}
                        </Typography>
                        {o.discount > 0 && (
                          <Typography variant="caption" sx={{ color: "success.main" }}>
                            {o.couponCode ? `${o.couponCode}: ` : ""}−{RS}
                            {o.discount}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="caption" color="text.secondary">
                          {o.shippingAddress?.city}, {o.shippingAddress?.state} -{" "}
                          {o.shippingAddress?.pincode}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Box sx={{ mb: 0.5 }}>
                          <PaymentChip status={o.paymentStatus} />
                        </Box>
                        <Select
                          size="small"
                          value={o.paymentStatus || "unpaid"}
                          disabled={busyId === o._id}
                          onChange={(e) => updatePayment(o._id, e.target.value)}
                          sx={{ fontSize: 12, height: 30, textTransform: "capitalize" }}
                        >
                          {PAYMENTS.map((p) => (
                            <MenuItem key={p} value={p} sx={{ textTransform: "capitalize" }}>
                              {p}
                            </MenuItem>
                          ))}
                        </Select>
                        {o.paymentStatus === "paid" && o.razorpayPaymentId && (
                          <Box sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                              {o.razorpayPaymentId}
                            </Typography>
                            <Tooltip title="Copy payment ID">
                              <IconButton size="small" onClick={() => copyText(o.razorpayPaymentId)}>
                                <ContentCopyIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        {o.paymentStatus === "failed" && (
                          <Box sx={{ mt: 0.75 }}>
                            {o.paymentFailureReason && (
                              <Typography variant="caption" sx={{ color: "warning.dark", display: "block" }}>
                                {o.paymentFailureReason.length > 40
                                  ? o.paymentFailureReason.slice(0, 40) + "…"
                                  : o.paymentFailureReason}
                              </Typography>
                            )}
                            {o.razorpayPaymentId && (
                              <Typography variant="caption" color="text.secondary">
                                {o.razorpayPaymentId}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ mb: 0.5 }}>
                          <StatusChip status={o.status} />
                        </Box>
                        <Select
                          size="small"
                          value={o.status || "pending"}
                          disabled={busyId === o._id}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                          sx={{ fontSize: 12, height: 30, textTransform: "capitalize" }}
                        >
                          {STATUSES.map((s) => (
                            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                              {s}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        {o.referrer ? (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {o.referrer?.name}
                            </Typography>
                            <StatusChip status={o.referralCredited ? "delivered" : "pending"} />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {RS}
                              {o.referralReward}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View order">
                            <IconButton
                              component={RouterLink}
                              to={`/orders/${o._id}`}
                              size="small"
                              color="secondary"
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete order">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={busyId === o._id}
                              onClick={() => setDeleteTarget(o)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Order #{deleteTarget ? String(deleteTarget._id).slice(-8) : ""} for{" "}
            <b>{deleteTarget?.user?.name || "this customer"}</b> will be permanently deleted,
            including its {deleteTarget?.images?.length || 0} uploaded photo
            {deleteTarget?.images?.length === 1 ? "" : "s"} from storage. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
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
    </Box>
  );
}
