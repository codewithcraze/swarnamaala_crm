import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Link,
  Menu,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SmartButtonOutlinedIcon from "@mui/icons-material/SmartButtonOutlined";
import DataObjectIcon from "@mui/icons-material/DataObject";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UndoIcon from "@mui/icons-material/Undo";
import { api } from "../api.js";
import { MediaPickerDialog } from "../components/MediaLibrary.jsx";
import { CampaignStatusChip } from "./Campaigns.jsx";
import { TEMPLATES, PLACEHOLDERS, BUTTON_SNIPPET, imageSnippet, previewHtml } from "../lib/emailTemplates.js";

const AUDIENCES = [
  { id: "all", label: "All users" },
  { id: "buyers", label: "Customers who paid for an order" },
  { id: "nonBuyers", label: "Users who never bought" },
  { id: "custom", label: "Custom list of emails" },
];
const TONES = ["Warm and friendly", "Festive", "Urgent but honest", "Short and simple", "Premium and elegant"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countEmails(text) {
  return new Set(
    String(text || "")
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s))
  ).size;
}

/* ---------------- AI dialog ---------------- */
function AiDialog({ open, onClose, currentHtml, onResult }) {
  const hasContent = !!currentHtml.trim();
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [mode, setMode] = useState("new");
  const [images, setImages] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setMode(hasContent ? "edit" : "new");
    }
  }, [open, hasContent]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const d = await api("/api/ai/email-template", {
        method: "POST",
        body: JSON.stringify({ prompt, tone, images, mode, currentHtml: mode === "edit" ? currentHtml : undefined }),
      });
      onResult(d, mode);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon color="secondary" /> Write with AI
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {hasContent && (
          <ToggleButtonGroup size="small" exclusive fullWidth value={mode} onChange={(_, v) => v && setMode(v)} sx={{ mb: 2 }}>
            <ToggleButton value="edit">Improve current email</ToggleButton>
            <ToggleButton value="new">Start fresh</ToggleButton>
          </ToggleButtonGroup>
        )}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          label={mode === "edit" ? "What should change?" : "What is this email about?"}
          placeholder={
            mode === "edit"
              ? "e.g. Make the headline punchier and add a section about gifting for Raksha Bandhan"
              : "e.g. Diwali offer: 15% off all packs with code DIWALI15 until 5 Nov. Mention magnets make great gifts for family."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <TextField select fullWidth size="small" label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} sx={{ mt: 2 }}>
          {TONES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" startIcon={<ImageOutlinedIcon />} onClick={() => setPickerOpen(true)}>
            {images.length ? "Change images" : "Add images"}
          </Button>
          {images.map((u) => (
            <Box key={u} component="img" src={u} alt="" sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
          ))}
          {images.length > 0 && (
            <Button size="small" color="inherit" onClick={() => setImages([])}>Clear</Button>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
          The AI only uses the facts you give it. Always read the result and send yourself a test before broadcasting.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || !prompt.trim()}
          onClick={generate}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
        >
          {busy ? "Writing…" : "Generate"}
        </Button>
      </DialogActions>
      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        confirmLabel="Use these"
        onConfirm={(urls) => {
          setImages(urls.slice(0, 8));
          setPickerOpen(false);
        }}
      />
    </Dialog>
  );
}

/* ---------------- Editor page ---------------- */
export default function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));

  const [c, setC] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [customText, setCustomText] = useState("");
  const [audienceCount, setAudienceCount] = useState(null);
  const [view, setView] = useState("desktop");
  const [tab, setTab] = useState(0); // narrow screens: 0 code, 1 preview
  const [prevHtml, setPrevHtml] = useState(null);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [phAnchor, setPhAnchor] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [failures, setFailures] = useState(null);

  const codeRef = useRef(null);
  const stopRef = useRef(false);

  const readOnly = c && c.status !== "draft";

  useEffect(() => {
    setLoading(true);
    Promise.all([api(`/api/campaigns/${id}`), api("/api/campaigns/meta")])
      .then(([d, m]) => {
        setC(d.campaign);
        setCustomText((d.campaign.audience?.emails || []).join("\n"));
        setMeta(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      stopRef.current = true;
    };
  }, [id]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const audience = c ? { type: c.audience?.type || "all", emails: c.audience?.type === "custom" ? customText : [] } : null;

  // Live recipient count (debounced).
  const audienceKey = c ? `${audience.type}|${audience.type === "custom" ? customText : ""}` : "";
  useEffect(() => {
    if (!c || readOnly) return undefined;
    setAudienceCount(null);
    const t = setTimeout(() => {
      api("/api/campaigns/audience-count", { method: "POST", body: JSON.stringify({ audience }) })
        .then(setAudienceCount)
        .catch(() => setAudienceCount(null));
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey, readOnly]);

  function patch(fields) {
    setC((x) => ({ ...x, ...fields }));
    setDirty(true);
  }

  const save = useCallback(
    async (quiet) => {
      if (!c || readOnly) return true;
      setSaving(true);
      try {
        const d = await api(`/api/campaigns/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name: c.name, subject: c.subject, preheader: c.preheader, html: c.html, audience }),
        });
        setC((x) => ({ ...x, updatedAt: d.campaign.updatedAt, audience: d.campaign.audience }));
        setDirty(false);
        if (!quiet) setToast("Saved.");
        return true;
      } catch (e) {
        setToast(e.message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c, id, readOnly, customText]
  );

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  // Insert text at the cursor in the HTML editor.
  function insertAtCursor(text) {
    const el = codeRef.current;
    const html = c.html || "";
    const start = el ? el.selectionStart : html.length;
    const end = el ? el.selectionEnd : html.length;
    const next = html.slice(0, start) + text + html.slice(end);
    patch({ html: next });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  function setHtmlWithUndo(html, extra = {}) {
    setPrevHtml(c.html || "");
    patch({ html, ...extra });
  }

  function applyTemplate(t) {
    if (c.html?.trim() && !window.confirm("Replace the current email with this template?")) return;
    setHtmlWithUndo(t.html, c.subject ? {} : { subject: t.subject });
    setTemplatesOpen(false);
  }

  async function sendTest() {
    setTestBusy(true);
    try {
      await api("/api/campaigns/test", {
        method: "POST",
        body: JSON.stringify({ to: testTo, subject: c.subject, preheader: c.preheader, html: c.html }),
      });
      setTestOpen(false);
      setToast(`Test sent to ${testTo}.`);
    } catch (e) {
      setToast(e.message);
    } finally {
      setTestBusy(false);
    }
  }

  // Ask the server for batches until everyone is done (or paused).
  async function runSending() {
    setSending(true);
    setSendError("");
    stopRef.current = false;
    let errors = 0;
    while (!stopRef.current) {
      try {
        const d = await api(`/api/campaigns/${id}/send-batch`, { method: "POST" });
        errors = 0;
        setC((x) => ({ ...x, status: d.status, stats: d.stats || x.stats }));
        if (d.done || d.status === "sent" || d.status === "paused") break;
        if (d.busy) await sleep(3000);
      } catch (e) {
        errors += 1;
        if (errors >= 3) {
          setSendError(`${e.message} Sending stopped; press Resume to try again.`);
          break;
        }
        await sleep(2000 * errors);
      }
    }
    setSending(false);
  }

  async function startSending() {
    if (dirty && !(await save(true))) return;
    try {
      const d = await api(`/api/campaigns/${id}/start`, { method: "POST" });
      setC((x) => ({ ...x, status: d.status, stats: d.stats }));
      setSendOpen(false);
      runSending();
    } catch (e) {
      setToast(e.message);
    }
  }

  async function pause() {
    stopRef.current = true;
    try {
      const d = await api(`/api/campaigns/${id}/pause`, { method: "POST" });
      setC((x) => ({ ...x, status: d.status, stats: d.stats }));
    } catch (e) {
      setToast(e.message);
    }
  }

  async function resume() {
    try {
      if (c.status === "paused") {
        const d = await api(`/api/campaigns/${id}/resume`, { method: "POST" });
        setC((x) => ({ ...x, status: d.status }));
      }
      runSending();
    } catch (e) {
      setToast(e.message);
    }
  }

  async function duplicate() {
    try {
      const d = await api(`/api/campaigns/${id}/duplicate`, { method: "POST" });
      navigate(`/campaigns/${d.campaign._id}`);
    } catch (e) {
      setToast(e.message);
    }
  }

  async function loadFailures() {
    try {
      const d = await api(`/api/campaigns/${id}/failures`);
      setFailures(d.failures);
    } catch (e) {
      setToast(e.message);
    }
  }

  if (loading) {
    return (
      <Box>
        <Skeleton width={200} />
        <Skeleton variant="rounded" height={480} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!c) return <Alert severity="warning">Campaign not found.</Alert>;

  const stats = c.stats || { total: 0, sent: 0, failed: 0, skipped: 0 };
  const processed = stats.sent + stats.failed + stats.skipped;
  const pct = stats.total ? (processed / stats.total) * 100 : 0;
  const localImages = /src=["']https?:\/\/(localhost|127\.0\.0\.1)/i.test(c.html || "");
  const canSend = meta?.mailConfigured && c.subject?.trim() && c.html?.trim() && (audienceCount?.count || 0) > 0;

  const codeEditor = (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Button size="small" startIcon={<DashboardCustomizeOutlinedIcon />} onClick={() => setTemplatesOpen(true)} disabled={readOnly}>
          Templates
        </Button>
        <Button size="small" startIcon={<ImageOutlinedIcon />} onClick={() => setImgOpen(true)} disabled={readOnly}>
          Image
        </Button>
        <Button size="small" startIcon={<SmartButtonOutlinedIcon />} onClick={() => insertAtCursor(BUTTON_SNIPPET)} disabled={readOnly}>
          Button
        </Button>
        <Button size="small" startIcon={<DataObjectIcon />} onClick={(e) => setPhAnchor(e.currentTarget)} disabled={readOnly}>
          Personalise
        </Button>
        {prevHtml !== null && !readOnly && (
          <Button
            size="small"
            color="inherit"
            startIcon={<UndoIcon />}
            onClick={() => {
              patch({ html: prevHtml });
              setPrevHtml(null);
            }}
          >
            Undo replace
          </Button>
        )}
      </Stack>
      <TextField
        inputRef={codeRef}
        multiline
        fullWidth
        minRows={isWide ? 30 : 18}
        maxRows={isWide ? 30 : 18}
        value={c.html || ""}
        onChange={(e) => patch({ html: e.target.value })}
        placeholder="Paste or write email HTML here, pick a template, or use Write with AI."
        InputProps={{ readOnly }}
        inputProps={{ spellCheck: false }}
        onKeyDown={(e) => {
          if (e.key === "Tab" && !readOnly) {
            e.preventDefault();
            insertAtCursor("  ");
          }
        }}
        sx={{
          "& textarea": {
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
            fontSize: 12.5,
            lineHeight: 1.55,
            whiteSpace: "pre",
            overflowX: "auto !important",
          },
          "& .MuiInputBase-root": { bgcolor: "#0f172a", color: "#e2e8f0", alignItems: "flex-start" },
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {(c.html || "").length.toLocaleString()} characters · Ctrl+S to save · Tab inserts spaces
      </Typography>
    </Box>
  );

  const preview = (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Preview with sample name “Priya”
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="desktop"><DesktopWindowsOutlinedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="mobile"><PhoneIphoneOutlinedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ bgcolor: "#e2e8f0", borderRadius: 2, p: 1.5, display: "flex", justifyContent: "center" }}>
        <Box
          component="iframe"
          title="Email preview"
          // No scripts, no navigation: just render the markup.
          sandbox=""
          srcDoc={previewHtml(c.html) || "<p style='font-family:sans-serif;color:#888;text-align:center;padding:40px'>Nothing to preview yet</p>"}
          sx={{
            width: view === "mobile" ? 375 : "100%",
            maxWidth: "100%",
            height: isWide ? 640 : 560,
            border: 0,
            bgcolor: "#fff",
            borderRadius: 1,
            boxShadow: "0 1px 6px rgba(0,0,0,.12)",
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Link
        component={RouterLink}
        to="/campaigns"
        underline="hover"
        color="text.secondary"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 2 }}
      >
        <ArrowBackIcon fontSize="small" /> All campaigns
      </Link>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
          <TextField
            variant="standard"
            value={c.name}
            onChange={(e) => patch({ name: e.target.value })}
            InputProps={{ readOnly, disableUnderline: readOnly, sx: { fontSize: 24, fontWeight: 700 } }}
            sx={{ flexGrow: 1, maxWidth: 520 }}
          />
          <CampaignStatusChip status={c.status} />
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {readOnly ? (
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={duplicate}>
              Duplicate to edit
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={() => setAiOpen(true)}
                disabled={!meta?.aiConfigured}
                title={meta?.aiConfigured ? "" : "Add AI_API_KEY to the server .env to enable"}
              >
                Write with AI
              </Button>
              <Button variant="outlined" startIcon={<ScienceOutlinedIcon />} onClick={() => setTestOpen(true)} disabled={!c.html?.trim()}>
                Send test
              </Button>
              <Button variant="outlined" startIcon={saving ? <CircularProgress size={16} /> : <SaveOutlinedIcon />} onClick={() => save()} disabled={saving || !dirty}>
                {dirty ? "Save" : "Saved"}
              </Button>
              <Button
                variant="contained"
                startIcon={<SendOutlinedIcon />}
                onClick={() => {
                  setConfirmed(false);
                  setSendOpen(true);
                }}
                disabled={!canSend}
              >
                Send
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {meta && !meta.mailConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>Email isn't set up on the server (MAIL_USER / APPPASSCODE), so nothing can be sent.</Alert>
      )}
      {meta && !meta.aiConfigured && !readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          To use “Write with AI”, add <code>AI_API_KEY</code> to the server <code>.env</code> (works with OpenAI, or any OpenAI-compatible
          provider via <code>AI_BASE_URL</code> and <code>AI_MODEL</code>).
        </Alert>
      )}
      {meta?.unsubLocal && !readOnly && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unsubscribe links will point to <code>{meta.unsubBase}</code>, which recipients can't open. Set{" "}
          <code>PUBLIC_API_URL</code> in the server <code>.env</code> to your deployed CRM API address, or send from the deployed CRM.
        </Alert>
      )}
      {localImages && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some images point to localhost. Recipients won't be able to load them. Set the server's SITE_URL to your live site and re-upload.
        </Alert>
      )}

      {/* Sending progress */}
      {readOnly && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {c.status === "sent"
                    ? `Finished ${c.finishedAt ? new Date(c.finishedAt).toLocaleString() : ""}`
                    : sending
                    ? "Sending… keep this page open."
                    : c.status === "paused"
                    ? "Paused"
                    : "Sending stopped. Press Resume to continue."}
                </Typography>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" color="success" variant="outlined" label={`${stats.sent} sent`} />
                  {stats.failed > 0 && <Chip size="small" color="error" variant="outlined" label={`${stats.failed} failed`} onClick={loadFailures} />}
                  {stats.skipped > 0 && <Chip size="small" variant="outlined" label={`${stats.skipped} unsubscribed`} />}
                  <Chip size="small" variant="outlined" label={`${stats.total - processed} waiting`} />
                </Stack>
              </Box>
              {c.status !== "sent" &&
                (sending ? (
                  <Button variant="outlined" startIcon={<PauseIcon />} onClick={pause}>Pause</Button>
                ) : (
                  <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={resume} disabled={!meta?.mailConfigured}>
                    Resume
                  </Button>
                ))}
            </Stack>
            {sendError && <Alert severity="error" sx={{ mt: 2 }}>{sendError}</Alert>}
            {failures && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                {failures.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No failures.</Typography>
                ) : (
                  failures.map((f) => (
                    <Typography key={f.email} variant="caption" display="block">
                      <b>{f.email}</b>: {f.error}
                    </Typography>
                  ))
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <TextField
              size="small"
              label="Subject line"
              value={c.subject || ""}
              onChange={(e) => patch({ subject: e.target.value })}
              InputProps={{ readOnly }}
              helperText={`${(c.subject || "").length}/250 · {{first_name}} works here too`}
            />
            <TextField
              size="small"
              label="Preview text (shown after the subject in the inbox)"
              value={c.preheader || ""}
              onChange={(e) => patch({ preheader: e.target.value })}
              InputProps={{ readOnly }}
            />
            <TextField
              select
              size="small"
              label="Send to"
              value={c.audience?.type || "all"}
              onChange={(e) => patch({ audience: { ...(c.audience || {}), type: e.target.value } })}
              disabled={readOnly}
              helperText={
                readOnly
                  ? `${stats.total} recipients`
                  : audienceCount
                  ? `${audienceCount.count} recipient${audienceCount.count === 1 ? "" : "s"}${audienceCount.suppressed ? ` (${audienceCount.suppressed} unsubscribed, skipped)` : ""}`
                  : "Counting…"
              }
            >
              {AUDIENCES.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>
              ))}
            </TextField>
            {c.audience?.type === "custom" && (
              <TextField
                size="small"
                multiline
                minRows={2}
                maxRows={6}
                label="Email addresses"
                placeholder="one@example.com, two@example.com"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setDirty(true);
                }}
                InputProps={{ readOnly }}
                helperText={`${countEmails(customText)} valid address${countEmails(customText) === 1 ? "" : "es"} · separate with commas, spaces or new lines`}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Editor + preview */}
      {isWide ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Card><CardContent>{codeEditor}</CardContent></Card>
          <Card><CardContent>{preview}</CardContent></Card>
        </Box>
      ) : (
        <Card>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tab label="HTML" />
            <Tab label="Preview" />
          </Tabs>
          <CardContent>{tab === 0 ? codeEditor : preview}</CardContent>
        </Card>
      )}

      {/* Placeholders menu */}
      <Menu anchorEl={phAnchor} open={!!phAnchor} onClose={() => setPhAnchor(null)}>
        {PLACEHOLDERS.map((p) => (
          <MenuItem
            key={p.key}
            onClick={() => {
              insertAtCursor(p.key);
              setPhAnchor(null);
            }}
          >
            <Typography variant="body2" sx={{ mr: 2 }}>{p.label}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", ml: "auto" }}>{p.key}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Templates */}
      <Dialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Start from a template</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
            {TEMPLATES.map((t) => (
              <Card key={t.id} variant="outlined" sx={{ cursor: "pointer", "&:hover": { borderColor: "secondary.main" } }} onClick={() => applyTemplate(t)}>
                <Box sx={{ height: 220, overflow: "hidden", bgcolor: "#f6f4ef", pointerEvents: "none" }}>
                  <Box
                    component="iframe"
                    title={t.name}
                    sandbox=""
                    srcDoc={previewHtml(t.html)}
                    sx={{ width: 640, height: 640, border: 0, transform: "scale(0.34)", transformOrigin: "top left" }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setTemplatesOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Insert images */}
      <MediaPickerDialog
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        onConfirm={(urls) => {
          insertAtCursor(urls.map(imageSnippet).join("\n"));
          setImgOpen(false);
        }}
      />

      {/* AI */}
      <AiDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentHtml={c.html || ""}
        onResult={(d, mode) => {
          const extra = {};
          if (d.subject && (mode === "new" || !c.subject)) extra.subject = d.subject;
          if (d.preheader && (mode === "new" || !c.preheader)) extra.preheader = d.preheader;
          setHtmlWithUndo(d.html, extra);
          setAiOpen(false);
          setToast("AI draft added. Review it, then send yourself a test.");
        }}
      />

      {/* Test */}
      <Dialog open={testOpen} onClose={() => !testBusy && setTestOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Send a test email</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>The subject will start with [TEST]. Unsaved changes are included.</DialogContentText>
          <TextField autoFocus fullWidth size="small" type="email" label="Send to" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setTestOpen(false)} disabled={testBusy}>Cancel</Button>
          <Button variant="contained" onClick={sendTest} disabled={testBusy || !testTo.trim() || !c.subject?.trim()}>
            {testBusy ? "Sending…" : "Send test"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm broadcast */}
      <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Send this campaign?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <b>{c.subject}</b>
            <br />
            will be emailed to <b>{audienceCount?.count ?? "…"}</b> recipient{audienceCount?.count === 1 ? "" : "s"}. Emails go out in batches
            of {meta?.batchSize || 10}; keep this page open until it finishes (you can pause and resume).
          </DialogContentText>
          {(audienceCount?.count || 0) > 450 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Gmail accounts can send about 500 emails a day (2,000 on Google Workspace). Larger lists may hit the limit; failed addresses are listed afterwards.
            </Alert>
          )}
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
            label={<Typography variant="body2">I've sent myself a test and checked it.</Typography>}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setSendOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendOutlinedIcon />} onClick={startSending} disabled={!confirmed}>
            Send now
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

