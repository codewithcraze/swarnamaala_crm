import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { api, apiUpload } from "../api.js";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function kb(n) {
  if (!n) return "";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

/**
 * Grid of uploaded campaign images with upload, copy URL and delete.
 * In picker mode, clicking an image toggles selection and `selected`/`onToggle`
 * are used by the parent.
 */
export default function MediaLibrary({ picker = false, selected = [], onToggle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(0);
  const [toast, setToast] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api("/api/media")
      .then((d) => setItems(d.media || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(fileList) {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setError("");
    const bad = files.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setError(`${bad.name}: use JPG, PNG, WebP or GIF under 10 MB.`);
      return;
    }
    setUploading(files.length);
    const added = [];
    for (const f of files) {
      try {
        const d = await apiUpload("/api/media", f);
        added.push(d.media);
        setItems((list) => [d.media, ...list]);
      } catch (e) {
        setError(`${f.name}: ${e.message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length === 1) {
      await copy(added[0].url);
      setToast("Uploaded. URL copied to clipboard.");
    } else if (added.length > 1) {
      setToast(`${added.length} images uploaded.`);
    }
    if (picker && onToggle) added.forEach((m) => onToggle(m.url, true));
  }

  async function remove(m) {
    if (!window.confirm("Delete this image? Emails already sent that use it will show a broken image.")) return;
    try {
      await api(`/api/media/${m._id}`, { method: "DELETE" });
      setItems((list) => list.filter((x) => x._id !== m._id));
      if (picker && onToggle && selected.includes(m.url)) onToggle(m.url, false);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Box>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: "2px dashed",
          borderColor: dragOver ? "secondary.main" : "divider",
          bgcolor: dragOver ? "action.hover" : "background.paper",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          mb: 2,
          transition: "all .15s",
        }}
      >
        <CloudUploadOutlinedIcon color="action" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Drop images here or click to upload
        </Typography>
        <Typography variant="caption" color="text.secondary">
          JPG, PNG, WebP or GIF, up to 10 MB. Keep email images under ~300 KB so they load fast.
        </Typography>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept={TYPES.join(",")}
          multiple
          onChange={(e) => {
            uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </Box>
      {uploading > 0 && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 1.5 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={170} />
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No images yet. Upload one to get a URL for your emails.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 1.5 }}>
          {items.map((m) => {
            const isSel = selected.includes(m.url);
            return (
              <Card
                key={m._id}
                variant="outlined"
                sx={{
                  position: "relative",
                  borderColor: isSel ? "secondary.main" : "divider",
                  borderWidth: isSel ? 2 : 1,
                }}
              >
                <Box
                  onClick={() => picker && onToggle?.(m.url, !isSel)}
                  sx={{
                    height: 120,
                    bgcolor: "action.hover",
                    cursor: picker ? "pointer" : "default",
                    backgroundImage: `url("${m.url}")`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />
                {isSel && (
                  <CheckCircleIcon color="secondary" sx={{ position: "absolute", top: 6, right: 6, bgcolor: "#fff", borderRadius: "50%" }} />
                )}
                <Stack direction="row" alignItems="center" sx={{ px: 1, py: 0.5 }}>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="caption" noWrap display="block" title={m.name}>
                      {m.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {kb(m.size)}
                    </Typography>
                  </Box>
                  <Tooltip title="Copy URL">
                    <IconButton
                      size="small"
                      onClick={async () => setToast((await copy(m.url)) ? "URL copied." : "Couldn't copy. Select it manually.")}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => remove(m)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

// Dialog wrapper: pick one or more images, then confirm.
export function MediaPickerDialog({ open, onClose, onConfirm, multiple = true, title = "Choose images", confirmLabel = "Insert" }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  function toggle(url, on) {
    setSelected((s) => {
      if (!multiple) return on ? [url] : [];
      return on ? (s.includes(url) ? s : [...s, url]) : s.filter((x) => x !== url);
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <MediaLibrary picker selected={selected} onToggle={toggle} />
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, pl: 1 }}>
          {selected.length ? `${selected.length} selected` : "Click images to select"}
        </Typography>
        <Button color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!selected.length} onClick={() => onConfirm(selected)}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
