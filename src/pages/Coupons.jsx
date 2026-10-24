import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { api } from "../api.js";
import { PageHeader, TableSkeleton, RS } from "../components/ui.jsx";

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: "",
  maxDiscount: "",
  minOrderValue: "",
  usageLimit: "",
  expiresAt: "",
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  function load() {
    setLoading(true);
    api("/api/coupons")
      .then((d) => setCoupons(d.coupons))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function generate(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase() || undefined,
        type: form.type,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
        expiresAt: form.expiresAt || null,
      };
      const { coupon } = await api("/api/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCoupons((prev) => [coupon, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c) {
    setBusyId(c._id);
    try {
      const { coupon } = await api(`/api/coupons/${c._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !c.active }),
      });
      setCoupons((prev) => prev.map((x) => (x._id === c._id ? coupon : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    setBusyId(c._id);
    try {
      await api(`/api/coupons/${c._id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((x) => x._id !== c._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
  }

  function discountLabel(c) {
    return c.type === "percent" ? `${c.value}% off` : `${RS}${c.value} off`;
  }

  function isExpired(c) {
    return c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
  }

  const paged = coupons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader
        title="Coupons"
        subtitle="Generate discount codes customers can apply at checkout."
      />

      {/* Generate form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Generate a coupon
          </Typography>
          <form onSubmit={generate}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Type"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  <MenuItem value="percent">Percentage (%)</MenuItem>
                  <MenuItem value="flat">Flat amount ({RS})</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={form.type === "percent" ? "Percent off (1–100)" : `Amount off (${RS})`}
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === "percent" ? "10" : "50"}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              {form.type === "percent" && (
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={`Max discount (${RS})`}
                    value={form.maxDiscount}
                    onChange={(e) => set("maxDiscount", e.target.value)}
                    placeholder="No cap"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={`Min order (${RS})`}
                  value={form.minOrderValue}
                  onChange={(e) => set("minOrderValue", e.target.value)}
                  placeholder="0"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Usage limit"
                  value={form.usageLimit}
                  onChange={(e) => set("usageLimit", e.target.value)}
                  placeholder="Unlimited"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Expires on"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Code (optional)"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="Auto-generate"
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
              </Grid>
            </Grid>
            {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formError}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {saving ? "Generating…" : "Generate coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 820 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Rules</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No coupons yet. Generate one above.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <TableRow key={c._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography sx={{ fontWeight: 700, fontFamily: "monospace", letterSpacing: 0.5 }}>
                            {c.code}
                          </Typography>
                          <Tooltip title="Copy code">
                            <IconButton size="small" onClick={() => copyCode(c.code)}>
                              <ContentCopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell>{discountLabel(c)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {c.type === "percent" && c.maxDiscount > 0 && <div>Max {RS}{c.maxDiscount}</div>}
                          {c.minOrderValue > 0 && <div>Min order {RS}{c.minOrderValue}</div>}
                          {!c.maxDiscount && !c.minOrderValue && "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {c.usedCount || 0}
                        {c.usageLimit > 0 ? ` / ${c.usageLimit}` : " / ∞"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Chip size="small" color="error" variant="outlined" label="expired" />
                        ) : c.active ? (
                          <Chip size="small" color="success" label="active" />
                        ) : (
                          <Chip size="small" color="warning" variant="outlined" label="inactive" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            disabled={busyId === c._id || expired}
                            onClick={() => toggleActive(c)}
                            sx={{ borderColor: "divider", color: "text.secondary" }}
                          >
                            {c.active ? "Disable" : "Enable"}
                          </Button>
                          <Tooltip title="Delete coupon">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={busyId === c._id}
                                onClick={() => remove(c)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
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
        {!loading && coupons.length > 0 && (
          <TablePagination
            component="div"
            count={coupons.length}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Card>
    </Box>
  );
}
