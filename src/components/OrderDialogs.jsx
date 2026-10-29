import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../api.js";
import { RS, SOURCES } from "./ui.jsx";

const ADDRESS_FIELDS = ["fullName", "phone", "line1", "line2", "city", "state", "pincode"];

function orderToForm(o) {
  const a = o.shippingAddress || {};
  return {
    product: o.product || "Custom Photo Magnet",
    unitLabel: o.unitLabel || "",
    quantity: o.quantity ?? 1,
    note: o.note || "",
    source: o.source || "website",
    externalOrderId: o.externalOrderId || "",
    subtotal: o.subtotal ?? "",
    gst: o.gst ?? "",
    discount: o.discount ?? 0,
    couponCode: o.couponCode || "",
    total: o.total ?? o.amount ?? "",
    address: Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, a[f] || ""])),
  };
}

// Edit the order's item, source, shipping address and amounts.
export function EditOrderDialog({ open, order, onClose, onSaved }) {
  const [form, setForm] = useState(() => orderToForm(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(orderToForm(order));
      setError("");
    }
  }, [open, order]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));
  const isWebsite = form.source === "website";

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = {
        product: form.product,
        unitLabel: form.unitLabel,
        quantity: Number(form.quantity),
        note: form.note,
        source: form.source,
        externalOrderId: isWebsite ? "" : form.externalOrderId,
        shippingAddress: form.address,
      };
      if (isWebsite) {
        Object.assign(body, {
          subtotal: form.subtotal,
          gst: form.gst,
          discount: form.discount,
          couponCode: form.couponCode,
          total: form.total,
        });
      }
      const d = await api(`/api/orders/${order._id}`, { method: "PATCH", body: JSON.stringify(body) });
      onSaved(d.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const money = { startAdornment: <InputAdornment position="start">{RS}</InputAdornment> };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Edit order #{String(order._id).slice(-8)}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Item</Typography>
        <Grid container spacing={2} sx={{ mb: 2, mt: 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Product" value={form.product} onChange={set("product")} />
          </Grid>
          <Grid size={{ xs: 8, sm: 4 }}>
            <TextField fullWidth size="small" label="Pack / unit label" value={form.unitLabel} onChange={set("unitLabel")} />
          </Grid>
          <Grid size={{ xs: 4, sm: 2 }}>
            <TextField fullWidth size="small" type="number" label="Qty" value={form.quantity} onChange={set("quantity")} inputProps={{ min: 1, max: 1000 }} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" multiline minRows={2} label="Customer note" value={form.note} onChange={set("note")} />
          </Grid>
        </Grid>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Source</Typography>
        <Grid container spacing={2} sx={{ mb: 2, mt: 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth size="small" label="Order came from" value={form.source} onChange={set("source")}>
              {SOURCES.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.id === "website" ? "Main site" : s.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {!isWebsite && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Platform order ID" value={form.externalOrderId} onChange={set("externalOrderId")} required />
            </Grid>
          )}
        </Grid>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Shipping address{isWebsite ? "" : " (optional for marketplace orders)"}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2, mt: 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Full name" value={form.address.fullName} onChange={setAddr("fullName")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Phone" value={form.address.phone} onChange={setAddr("phone")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Address line 1" value={form.address.line1} onChange={setAddr("line1")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Address line 2" value={form.address.line2} onChange={setAddr("line2")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="City" value={form.address.city} onChange={setAddr("city")} />
          </Grid>
          <Grid size={{ xs: 7, sm: 4 }}>
            <TextField fullWidth size="small" label="State" value={form.address.state} onChange={setAddr("state")} />
          </Grid>
          <Grid size={{ xs: 5, sm: 4 }}>
            <TextField fullWidth size="small" label="Pincode" value={form.address.pincode} onChange={setAddr("pincode")} inputProps={{ inputMode: "numeric", maxLength: 6 }} />
          </Grid>
        </Grid>

        {isWebsite && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Amounts</Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 6, sm: 2.4 }}>
                <TextField fullWidth size="small" type="number" label="Subtotal" value={form.subtotal} onChange={set("subtotal")} InputProps={money} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.4 }}>
                <TextField fullWidth size="small" type="number" label="GST" value={form.gst} onChange={set("gst")} InputProps={money} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.4 }}>
                <TextField fullWidth size="small" type="number" label="Discount" value={form.discount} onChange={set("discount")} InputProps={money} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.4 }}>
                <TextField fullWidth size="small" label="Coupon" value={form.couponCode} onChange={set("couponCode")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 2.4 }}>
                <TextField fullWidth size="small" type="number" label="Total" value={form.total} onChange={set("total")} InputProps={money} />
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Changing amounts only updates the record. It doesn't charge or refund the customer on Razorpay.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Edit the customer's name, email and phone.
export function EditCustomerDialog({ open, user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && user) {
      setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
      setError("");
    }
  }, [open, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      const d = await api(`/api/users/${user._id}`, { method: "PATCH", body: JSON.stringify(form) });
      onSaved(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>Edit customer</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth size="small" label="Name" value={form.name} onChange={set("name")} sx={{ mb: 2 }} />
        <TextField fullWidth size="small" type="email" label="Email" value={form.email} onChange={set("email")} sx={{ mb: 2 }} helperText="The customer signs in with this email." />
        <TextField fullWidth size="small" label="Phone" value={form.phone} onChange={set("phone")} />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Confirm, then reset the password; the server emails the new one.
export function ResetPasswordDialog({ open, user, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  async function reset() {
    setBusy(true);
    setError("");
    try {
      const d = await api(`/api/users/${user._id}/reset-password`, { method: "POST" });
      onDone(d.email);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="xs">
      <DialogTitle>Reset password?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText>
          A new random password will be generated and emailed to <b>{user?.email}</b>. Their current password
          will stop working. You won't see the new password here.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={reset} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
          {busy ? "Sending…" : "Reset & email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Delete a customer. Loads what would be removed first; if they have orders the
// admin must tick a box to delete those (and their photos) too.
export function DeleteUserDialog({ open, user, onClose, onDeleted }) {
  const [summary, setSummary] = useState(null);
  const [withOrders, setWithOrders] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user?._id) return;
    setSummary(null);
    setWithOrders(false);
    setError("");
    api(`/api/users/${user._id}/summary`)
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, [open, user?._id]);

  const hasOrders = (summary?.orderCount || 0) > 0;
  const isAdmin = summary?.user?.role === "admin";

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const d = await api(`/api/users/${user._id}${withOrders ? "?withOrders=1" : ""}`, { method: "DELETE" });
      onDeleted(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Delete customer?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText sx={{ mb: 1.5 }}>
          <b>{user?.name}</b> ({user?.email}) will be permanently deleted and can no longer sign in. This can't be undone.
        </DialogContentText>
        {!summary && !error && <CircularProgress size={20} />}
        {isAdmin && <Alert severity="warning">Admin accounts can't be deleted from the CRM.</Alert>}
        {summary && !isAdmin && (
          <>
            {hasOrders ? (
              <>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  They have <b>{summary.orderCount}</b> order{summary.orderCount === 1 ? "" : "s"} with{" "}
                  <b>{summary.photoCount}</b> photo{summary.photoCount === 1 ? "" : "s"}.
                </Alert>
                <FormControlLabel
                  control={<Checkbox checked={withOrders} onChange={(e) => setWithOrders(e.target.checked)} />}
                  label={<Typography variant="body2">Also delete their orders and photos from storage</Typography>}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">No orders on this account.</Typography>
            )}
            {summary.referredCount > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {summary.referredCount} user{summary.referredCount === 1 ? " was" : "s were"} referred by them. Those
                accounts stay; the referral link is removed.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={remove}
          disabled={busy || !summary || isAdmin || (hasOrders && !withOrders)}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {busy ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
