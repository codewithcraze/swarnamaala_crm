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
  Divider,
  ImageList,
  ImageListItem,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
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

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    api(`/api/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        setNote(d.order.adminNote || "");
      })
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

  async function saveNote() {
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      await api(`/api/orders/${id}/note`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote: note }),
      });
      setOrder((o) => ({ ...o, adminNote: note }));
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch (e) {
      alert(e.message);
    } finally {
      setNoteSaving(false);
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
            <Grid item xs={12} md={4} key={i}>
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
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <SectionTitle>Customer</SectionTitle>
                <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{order.user?.name || "—"}</Typography>
                <Typography variant="body2" color="text.secondary">{order.user?.email}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress?.phone || order.user?.phone}
                </Typography>
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

        {/* MIDDLE: item + controls + note */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <SectionTitle>Item</SectionTitle>
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
                    <Typography variant="body2">{order.note}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <SectionTitle>Update</SectionTitle>
                <Stack spacing={2} sx={{ mt: 1.5 }}>
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
                <SectionTitle>Internal note</SectionTitle>
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  size="small"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a private note about this order (not visible to the customer)…"
                  sx={{ mt: 1.5 }}
                />
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                  <Button variant="contained" onClick={saveNote} disabled={noteSaving}>
                    {noteSaving ? "Saving…" : "Save note"}
                  </Button>
                  {noteSaved && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "success.main" }}>
                      <CheckCircleOutlineIcon fontSize="small" />
                      <Typography variant="body2">Saved</Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT: referral + photos */}
        <Grid item xs={12} md={4}>
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
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <SectionTitle>Photos ({images.length})</SectionTitle>
                  {images.length > 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={downloadAll}
                      disabled={downloading}
                      startIcon={
                        downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadOutlinedIcon />
                      }
                    >
                      {downloading ? "Preparing…" : "Download ZIP"}
                    </Button>
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
