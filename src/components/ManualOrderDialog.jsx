import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { api, apiUpload } from "../api.js";
import { RS, MANUAL_SOURCES, sourceLabel, sourceColor } from "./ui.jsx";
import { AgentSelect } from "./agents.jsx";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];

const EMPTY = {
  source: "meesho",
  externalOrderId: "",
  customerName: "",
  customerPhone: "",
  agentId: "",
  quantity: "",
  total: "",
  paymentStatus: "paid",
  status: "pending",
  note: "",
  address: { line1: "", line2: "", city: "", state: "", pincode: "" },
};

// Upload files a few at a time; calls onDone(i, url) per finished file.
async function uploadAll(items, onDone) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const { url } = await apiUpload("/api/upload", items[i].file);
      onDone(i, url);
    }
  }
  await Promise.all([worker(), worker(), worker()]);
}

// Form to add an order by hand (Meesho / Flipkart / Amazon / self).
export default function ManualOrderDialog({ open, agents, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]); // { file, preview, url? }
  const [label, setLabel] = useState(null); // File
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const photoInput = useRef(null);
  const labelInput = useRef(null);
  // Uploaded label URL, reused if saving fails after the upload.
  const labelUrlRef = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Free preview URLs on unmount.
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  useEffect(() => {
    if (open) {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
      setForm(EMPTY);
      setPhotos([]);
      setLabel(null);
      labelUrlRef.current = null;
      setError("");
      setProgress("");
    }
  }, [open]);

  const isSelf = form.source === "self";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  function chooseSource(_e, source) {
    if (!source) return;
    // Platform orders are already paid on the platform; self orders usually aren't yet.
    setForm((f) => ({ ...f, source, paymentStatus: source === "self" ? "unpaid" : "paid" }));
  }

  function addPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const bad = files.filter((f) => !IMAGE_TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad.length) {
      setError(`${bad.length} file${bad.length === 1 ? " was" : "s were"} skipped. Photos must be JPG, PNG, WEBP or GIF and under 10 MB.`);
    } else setError("");
    const ok = files.filter((f) => !bad.includes(f));
    setPhotos((p) => [...p, ...ok.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removePhoto(i) {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos((p) => p.filter((_, j) => j !== i));
  }

  function chooseLabel(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return setError("The label must be a PDF file.");
    if (file.size > MAX_BYTES) return setError("The label PDF must be under 10 MB.");
    setError("");
    setLabel(file);
    labelUrlRef.current = null;
  }

  async function save() {
    setError("");
    if (!isSelf && !form.externalOrderId.trim()) return setError("Enter the platform order ID.");
    if (!form.customerName.trim()) return setError("Enter the customer's name.");
    if (photos.length === 0) return setError("Add at least one photo.");

    setSaving(true);
    try {
      // Photos already uploaded in an earlier failed attempt are reused.
      const urls = photos.map((p) => p.url || null);
      const pending = photos.map((p, i) => ({ ...p, i })).filter((p) => !p.url);
      let done = photos.length - pending.length;
      setProgress(`Uploading photos ${done}/${photos.length}…`);
      await uploadAll(pending, (k, url) => {
        const idx = pending[k].i;
        urls[idx] = url;
        // Remember the URL so a retry after an error doesn't upload it again.
        setPhotos((p) => p.map((x, i) => (i === idx ? { ...x, url } : x)));
        done += 1;
        setProgress(`Uploading photos ${done}/${photos.length}…`);
      });

      let labelUrl = "";
      if (label) {
        setProgress("Uploading label…");
        if (!labelUrlRef.current) labelUrlRef.current = (await apiUpload("/api/upload/label", label)).url;
        labelUrl = labelUrlRef.current;
      }

      setProgress("Saving order…");
      const d = await api("/api/manual-orders", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          externalOrderId: form.externalOrderId.trim(),
          agentId: form.agentId || null,
          images: urls,
          labelUrl: labelUrl || undefined,
        }),
      });
      onCreated(d.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setProgress("");
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Add manual order</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Order came from</Typography>
        <ToggleButtonGroup exclusive value={form.source} onChange={chooseSource} size="small" sx={{ display: "flex", flexWrap: "wrap", mb: 2, mt: 0.5 }}>
          {MANUAL_SOURCES.map((s) => (
            <ToggleButton
              key={s}
              value={s}
              sx={{
                px: 2.5,
                fontWeight: 700,
                "&.Mui-selected, &.Mui-selected:hover": { bgcolor: sourceColor(s), color: "#fff" },
              }}
            >
              {sourceLabel(s)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={isSelf ? "Order / reference ID (optional)" : `${sourceLabel(form.source)} order ID`}
              required={!isSelf}
              value={form.externalOrderId}
              onChange={set("externalOrderId")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AgentSelect
              agents={agents}
              value={form.agentId}
              onChange={(id) => setForm((f) => ({ ...f, agentId: id || "" }))}
              label="Agent"
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Customer name" required value={form.customerName} onChange={set("customerName")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Phone number" value={form.customerPhone} onChange={set("customerPhone")} inputProps={{ inputMode: "tel" }} />
          </Grid>
        </Grid>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Photos ({photos.length})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5, mb: 2 }}>
          {photos.map((p, i) => (
            <Box key={p.preview} sx={{ position: "relative", width: 84, height: 84 }}>
              <Box
                component="img"
                src={p.preview}
                alt={`Photo ${i + 1}`}
                sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
              />
              {!saving && (
                <IconButton
                  size="small"
                  onClick={() => removePhoto(i)}
                  sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(0,0,0,.6)", color: "#fff", p: 0.25, "&:hover": { bgcolor: "rgba(0,0,0,.8)" } }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={() => photoInput.current?.click()}
            disabled={saving}
            sx={{ width: 84, height: 84, flexDirection: "column", gap: 0.5, borderStyle: "dashed", fontSize: 11 }}
          >
            <AddPhotoAlternateOutlinedIcon />
            Add
          </Button>
          <input ref={photoInput} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden onChange={addPhotos} />
        </Box>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Shipping label (PDF)</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, mb: 2 }}>
          <Button variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} onClick={() => labelInput.current?.click()} disabled={saving}>
            {label ? "Change PDF" : "Choose PDF"}
          </Button>
          {label && (
            <>
              <Typography variant="body2" noWrap sx={{ maxWidth: 320 }} title={label.name}>{label.name}</Typography>
              {!saving && (
                <Tooltip title="Remove label">
                  <IconButton size="small" onClick={() => { setLabel(null); labelUrlRef.current = null; }}><CloseIcon fontSize="small" /></IconButton>
                </Tooltip>
              )}
            </>
          )}
          <input ref={labelInput} type="file" accept="application/pdf" hidden onChange={chooseLabel} />
        </Stack>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Details</Typography>
        <Grid container spacing={2} sx={{ mb: 2, mt: 0 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Quantity"
              value={form.quantity}
              onChange={set("quantity")}
              placeholder={String(photos.length || 1)}
              helperText="Blank = number of photos"
              inputProps={{ min: 1, max: 1000 }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Amount"
              value={form.total}
              onChange={set("total")}
              InputProps={{ startAdornment: <InputAdornment position="start">{RS}</InputAdornment> }}
              helperText="Optional"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField select fullWidth size="small" label="Payment" value={form.paymentStatus} onChange={set("paymentStatus")}>
              {PAYMENTS.map((p) => (
                <MenuItem key={p} value={p} sx={{ textTransform: "capitalize" }}>{p}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField select fullWidth size="small" label="Status" value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" multiline minRows={2} label="Note" value={form.note} onChange={set("note")} />
          </Grid>
        </Grid>

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Address (optional{isSelf ? "" : ", the platform ships these"})
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0 }}>
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

        {saving && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">{progress}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {saving ? "Saving…" : "Add order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
