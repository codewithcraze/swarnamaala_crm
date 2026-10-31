import { useEffect, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Stack,
  Link,
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { api, downloadBlob } from "../api.js";
import {
  PageHeader,
  StatusChip,
  PaymentChip,
  RS,
  SourceChip,
  sourceLabel,
  isMarketplaceOrder,
} from "../components/ui.jsx";
import { EditOrderDialog, EditCustomerDialog, ResetPasswordDialog, DeleteUserDialog } from "../components/OrderDialogs.jsx";
import OrderNotes from "../components/OrderNotes.jsx";
import { useAgents, AgentSelect, assignAgent } from "../components/agents.jsx";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];
const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function imageSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : url;
}

function fmt(d) {
  return d ? new Date(d).toLocaleString() : "—";
}

function SectionTitle({ children }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.06em" }}>
      {children}
    </Typography>
  );
}

// Card heading with an optional action on the right.
function CardHead({ title, action }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <SectionTitle>{title}</SectionTitle>
      {action}
    </Stack>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { agents } = useAgents();

  function load() {
    setLoading(true);
    api(`/api/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status) {
    setBusy(true);
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrder((o) => ({ ...o, status }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updatePayment(paymentStatus) {
    setBusy(true);
    try {
      await api(`/api/orders/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setOrder((o) => ({ ...o, paymentStatus }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateAgent(agentId) {
    setBusy(true);
    try {
      const d = await assignAgent(id, agentId);
      setOrder((o) => ({ ...o, agent: d.agent ? { _id: agentId, name: d.agent.name } : null }));
      setToast(d.agent ? `Assigned to ${d.agent.name}.` : "Agent removed.");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder() {
    setDeleting(true);
    try {
      await api(`/api/orders/${id}`, { method: "DELETE" });
      navigate("/orders", { replace: true });
    } catch (e) {
      alert(e.message);
      setDeleting(false);
    }
  }

  async function downloadAll() {
    setDownloading(true);
    try {
      const shortId = String(order._id).slice(-8);
      await downloadBlob(`/api/orders/${id}/images.zip`, `order-${shortId}-photos.zip`);
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <Box>
        <Skeleton width={160} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Alert severity="warning">Order not found.</Alert>;

  const images = order.images || [];
  const customer = order.user;

  return (
    <Box>
      <Link
        component={RouterLink}
        to="/orders"
        underline="hover"
        color="text.secondary"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 2 }}
      >
        <ArrowBackIcon fontSize="small" /> Back to orders
      </Link>

      <PageHeader
        title={`Order #${String(order._id).slice(-8)}`}
        subtitle={`Placed ${fmt(order.createdAt)}`}
        action={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <SourceChip source={order.source} />
            <PaymentChip status={order.paymentStatus} />
            <StatusChip status={order.status} />
            <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditOrderOpen(true)}>
              Edit order
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2} alignItems="flex-start">
        {/* LEFT: customer + shipping + payment */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <CardHead
                  title="Customer"
                  action={
                    customer?._id && (
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditCustomerOpen(true)}>
                        Edit
                      </Button>
                    )
                  }
                />
                <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{customer?.name || "—"}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  {customer?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {customer?.phone || order.shippingAddress?.phone}
                </Typography>
                {customer?._id && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<LockResetOutlinedIcon />}
                    onClick={() => setResetOpen(true)}
                    sx={{ mt: 1.5 }}
                  >
                    Reset password
                  </Button>
                )}
                {customer?._id && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setDeleteUserOpen(true)}
                    sx={{ mt: 1.5, ml: 1 }}
                  >
                    Delete user
                  </Button>
                )}
              </CardContent>
            </Card>

            {isMarketplaceOrder(order) && (
              <Card sx={{ borderColor: "secondary.main" }}>
                <CardContent>
                  <SectionTitle>Marketplace order</SectionTitle>
                  <Typography sx={{ mt: 0.5, fontWeight: 600 }}>{sourceLabel(order.source)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Platform order ID:{" "}
                    <Box component="b" sx={{ color: "text.primary", fontFamily: "monospace" }}>
                      {order.externalOrderId || "—"}
                    </Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Paid and shipped through {sourceLabel(order.source)}. Photos sent via the public upload link.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {order.shippingAddress?.line1 && (
              <Card>
                <CardContent>
                  <SectionTitle>Ship to</SectionTitle>
                  <Typography sx={{ mt: 0.5 }}>{order.shippingAddress?.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">{order.shippingAddress?.line1}</Typography>
                  {order.shippingAddress?.line2 && (
                    <Typography variant="body2" color="text.secondary">{order.shippingAddress.line2}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </Typography>
                  {order.shippingAddress?.phone && (
                    <Typography variant="body2" color="text.secondary">{order.shippingAddress.phone}</Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {!isMarketplaceOrder(order) && (
              <Card>
                <CardContent>
                  <SectionTitle>Payment</SectionTitle>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Total{" "}
                    <Box component="b" sx={{ color: "text.primary" }}>
                      {RS}{order.total ?? order.amount}
                    </Box>{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({RS}{order.subtotal ?? "—"} + {RS}{order.gst ?? 0} GST)
                    </Typography>
                  </Typography>
                  {order.discount > 0 && (
                    <Typography variant="body2" sx={{ color: "success.main", mt: 0.5 }}>
                      Coupon {order.couponCode ? <b>{order.couponCode}</b> : null} · saved {RS}{order.discount}
                    </Typography>
                  )}
                  {order.razorpayPaymentId && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Payment ID:{" "}
                      <Box component="b" sx={{ color: "text.primary", fontFamily: "monospace" }}>
                        {order.razorpayPaymentId}
                      </Box>
                    </Typography>
                  )}
                  {order.razorpayOrderId && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rzp order: {order.razorpayOrderId}
                    </Typography>
                  )}
                  {order.paidAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Paid: {fmt(order.paidAt)}
                    </Typography>
                  )}
                  {order.paymentStatus === "failed" && (
                    <Alert severity="warning" sx={{ mt: 1 }} icon={false}>
                      {order.paymentFailureReason}
                      {order.paymentFailedAt && (
                        <Typography variant="caption" display="block">
                          Failed: {fmt(order.paymentFailedAt)}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* MIDDLE: item + controls + notes */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <CardHead
                  title="Item"
                  action={
                    <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditOrderOpen(true)}>
                      Edit
                    </Button>
                  }
                />
                <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                  {order.product || "Custom Photo Magnet"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.unitLabel} · Qty {order.quantity}
                </Typography>
                {order.note && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Customer note:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{order.note}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <SectionTitle>Update</SectionTitle>
                <Stack spacing={2} sx={{ mt: 1.5 }}>
                  <AgentSelect
                    agents={agents}
                    value={order.agent?._id || order.agent || ""}
                    disabled={busy}
                    onChange={updateAgent}
                    label="Taken by agent"
                    sx={{ width: "100%" }}
                  />
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Order status"
                    value={order.status || "pending"}
                    disabled={busy}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Payment status"
                    value={order.paymentStatus || "unpaid"}
                    disabled={busy}
                    onChange={(e) => updatePayment(e.target.value)}
                  >
                    {PAYMENTS.map((p) => (
                      <MenuItem key={p} value={p} sx={{ textTransform: "capitalize" }}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <SectionTitle>Internal notes ({(order.adminNotes || []).length})</SectionTitle>
                <OrderNotes
                  orderId={order._id}
                  notes={order.adminNotes}
                  onChange={(adminNotes) => setOrder((o) => ({ ...o, adminNotes }))}
                />
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT: referral + photos */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            {order.referrer && (
              <Card>
                <CardContent>
                  <SectionTitle>Referral</SectionTitle>
                  <Typography sx={{ mt: 0.5 }}>{order.referrer?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{order.referrer?.email}</Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip status={order.referralCredited ? "delivered" : "pending"} />
                    <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                      {order.referralCredited ? "credited" : "pending"} {RS}{order.referralReward}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  useFlexGap
                  spacing={1}
                  sx={{ mb: 1.5 }}
                >
                  <SectionTitle>Photos ({images.length})</SectionTitle>
                  {images.length > 0 && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/orders/${id}/print`}
                        startIcon={<PrintOutlinedIcon />}
                      >
                        Print A4
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={downloadAll}
                        disabled={downloading}
                        startIcon={
                          downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadOutlinedIcon />
                        }
                      >
                        {downloading ? "Preparing…" : "ZIP"}
                      </Button>
                    </Stack>
                  )}
                </Stack>
                {images.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No photos on this order.
                  </Typography>
                ) : (
                  <ImageList cols={3} gap={8} sx={{ m: 0 }}>
                    {images.map((img, i) => {
                      const src = imageSrc(img);
                      return (
                        <ImageListItem key={i}>
                          <a href={src} target="_blank" rel="noreferrer" title={`Open photo ${i + 1}`}>
                            <Box
                              component="img"
                              src={src}
                              alt={`Photo ${i + 1}`}
                              loading="lazy"
                              sx={{
                                width: "100%",
                                aspectRatio: "1",
                                objectFit: "cover",
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            />
                          </a>
                        </ImageListItem>
                      );
                    })}
                  </ImageList>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <EditOrderDialog
        open={editOrderOpen}
        order={order}
        onClose={() => setEditOrderOpen(false)}
        onSaved={(o) => {
          setOrder(o);
          setEditOrderOpen(false);
          setToast("Order updated.");
        }}
      />
      <EditCustomerDialog
        open={editCustomerOpen}
        user={customer}
        onClose={() => setEditCustomerOpen(false)}
        onSaved={(u) => {
          setOrder((o) => ({ ...o, user: { ...o.user, ...u } }));
          setEditCustomerOpen(false);
          setToast("Customer details saved.");
        }}
      />
      <ResetPasswordDialog
        open={resetOpen}
        user={customer}
        onClose={() => setResetOpen(false)}
        onDone={(email) => {
          setResetOpen(false);
          setToast(`New password emailed to ${email}.`);
        }}
      />

      <DeleteUserDialog
        open={deleteUserOpen}
        user={customer}
        onClose={() => setDeleteUserOpen(false)}
        onDeleted={(d) => {
          setDeleteUserOpen(false);
          if (d.deletedOrders) navigate("/users", { replace: true });
          else load();
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)}>
        <DialogTitle>Delete this order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Order #{String(order._id).slice(-8)} will be permanently deleted, including its{" "}
            {images.length} uploaded photo{images.length === 1 ? "" : "s"} from storage. This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={deleteOrder}
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
