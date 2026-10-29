import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Skeleton,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import CropFreeIcon from "@mui/icons-material/CropFree";
import { api } from "../api.js";

// All layout maths is in millimetres; CSS renders `mm` units at true size when
// printed at 100% scale, so a 65×90 mm frame comes out as 65×90 mm on paper.
const A4 = { w: 210, h: 297 };
const DEFAULT_FRAME = { w: 65, h: 90 };
const PRESETS = [
  { id: "65x90", label: "65 × 90 mm (standard)", w: 65, h: 90 },
  { id: "custom", label: "Custom size" },
];
const DEFAULT_SETTINGS = {
  preset: "65x90",
  frameW: DEFAULT_FRAME.w,
  frameH: DEFAULT_FRAME.h,
  margin: 5,
  gap: 2,
  orientation: "portrait",
  cutLines: true,
};
const DEFAULT_ADJ = { s: 1, x: 0, y: 0, r: 0 };
const MAX_SCALE = 6;
const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function imageSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : url;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function pageSize(orientation) {
  return orientation === "landscape" ? { w: A4.h, h: A4.w } : { w: A4.w, h: A4.h };
}

// How many frames fit on one sheet, and where the (centred) grid starts.
function computeGrid(s) {
  const { w: pw, h: ph } = pageSize(s.orientation);
  const aw = pw - 2 * s.margin;
  const ah = ph - 2 * s.margin;
  const cols = s.frameW > 0 ? Math.max(0, Math.floor((aw + s.gap) / (s.frameW + s.gap))) : 0;
  const rows = s.frameH > 0 ? Math.max(0, Math.floor((ah + s.gap) / (s.frameH + s.gap))) : 0;
  const gridW = cols * s.frameW + Math.max(0, cols - 1) * s.gap;
  const gridH = rows * s.frameH + Math.max(0, rows - 1) * s.gap;
  return {
    pw,
    ph,
    cols,
    rows,
    perPage: cols * rows,
    offX: (pw - gridW) / 2,
    offY: (ph - gridH) / 2,
  };
}

// Size (mm) of the photo's visible box inside a frame. Scale 1 = "cover":
// the photo just fills the frame. Rotation by 90/270 swaps the photo's sides.
function photoBox(adj, nat, fw, fh) {
  const rot = (((adj.r || 0) % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const iw = swap ? nat.h : nat.w;
  const ih = swap ? nat.w : nat.h;
  const cover = Math.max(fw / iw, fh / ih);
  const k = cover * adj.s;
  return { vw: iw * k, vh: ih * k, rot, swap, containScale: Math.min(fw / iw, fh / ih) / cover };
}

// Keep the photo from being dragged out of the frame. When the photo is bigger
// than the frame it must keep covering it; when smaller it must stay inside.
function clampAdj(adj, nat, fw, fh) {
  if (!nat || !(fw > 0 && fh > 0)) return adj;
  const { vw, vh, containScale } = photoBox(adj, nat, fw, fh);
  const minS = Math.min(1, containScale);
  if (adj.s < minS - 1e-6 || adj.s > MAX_SCALE) {
    return clampAdj({ ...adj, s: clamp(adj.s, minS, MAX_SCALE) }, nat, fw, fh);
  }
  const mx = Math.abs(vw - fw) / 2 / fw;
  const my = Math.abs(vh - fh) / 2 / fh;
  return { ...adj, x: clamp(adj.x, -mx, mx), y: clamp(adj.y, -my, my) };
}

function storageKey(id) {
  return `sm-print-${id}`;
}

function loadSaved(id) {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* One frame on the sheet: drag to pan, wheel / pinch to zoom.         */
/* ------------------------------------------------------------------ */
function Frame({ index, src, adj, nat, fw, fh, left, top, selected, cutLines, onSelect, onChange, onNatural }) {
  const ref = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const adjRef = useRef(adj);
  adjRef.current = adj;

  // Wheel zoom only when this frame is selected, so normal page scrolling
  // still works. Needs a non-passive listener to call preventDefault.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    function onWheel(e) {
      if (!selectedRef.current) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      onChange(index, (a) => ({ ...a, s: a.s * factor }));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [index, onChange]);

  function pxPerMm() {
    const rect = ref.current.getBoundingClientRect();
    return rect.width / fw || 1;
  }

  function startGesture() {
    const pts = [...pointers.current.values()];
    const base = adjRef.current;
    if (pts.length === 1) {
      gesture.current = { type: "pan", sx: pts[0].x, sy: pts[0].y, adj: base, ppm: pxPerMm() };
    } else if (pts.length >= 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      gesture.current = { type: "pinch", d, adj: base };
    }
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    onSelect(index);
    ref.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.type === "pan" && pts.length === 1) {
      const dx = (pts[0].x - g.sx) / g.ppm / fw;
      const dy = (pts[0].y - g.sy) / g.ppm / fh;
      onChange(index, () => ({ ...g.adj, x: g.adj.x + dx, y: g.adj.y + dy }));
    } else if (g.type === "pinch" && pts.length >= 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      onChange(index, () => ({ ...g.adj, s: g.adj.s * (d / g.d) }));
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    // Restart from the current state so lifting one finger of a pinch
    // continues as a pan without a jump.
    gesture.current = null;
    if (pointers.current.size > 0) startGesture();
  }

  let photo;
  if (nat) {
    const { vw, vh, rot, swap } = photoBox(adj, nat, fw, fh);
    const boxLeft = fw / 2 + adj.x * fw - vw / 2;
    const boxTop = fh / 2 + adj.y * fh - vh / 2;
    photo = (
      <div
        style={{
          position: "absolute",
          left: `${boxLeft}mm`,
          top: `${boxTop}mm`,
          width: `${vw}mm`,
          height: `${vh}mm`,
        }}
      >
        <img
          src={src}
          alt={`Photo ${index + 1}`}
          draggable={false}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${swap ? vh : vw}mm`,
            height: `${swap ? vw : vh}mm`,
            maxWidth: "none",
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>
    );
  } else {
    photo = (
      <img
        src={src}
        alt={`Photo ${index + 1}`}
        draggable={false}
        onLoad={(e) => onNatural(index, { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`ps-frame${selected ? " is-selected" : ""}${cutLines ? " has-cut" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        left: `${left}mm`,
        top: `${top}mm`,
        width: `${fw}mm`,
        height: `${fh}mm`,
        overflow: "hidden",
        background: "#fff",
        cursor: "grab",
        touchAction: "none",
      }}
    >
      {photo}
      <span className="ps-index no-print">{index + 1}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PrintSheet() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const saved = useMemo(() => loadSaved(id), [id]);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...(saved?.settings || {}) }));
  const [adjs, setAdjs] = useState(() => saved?.adjs || {});
  const [dims, setDims] = useState({});
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api(`/api/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Persist work so a refresh doesn't lose the adjustments.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ settings, adjs }));
    } catch {
      /* storage full / disabled: ignore */
    }
  }, [id, settings, adjs]);

  const fw = settings.frameW;
  const fh = settings.frameH;
  const grid = computeGrid(settings);
  const images = order?.images || [];
  const pages = grid.perPage > 0 ? Math.ceil(images.length / grid.perPage) : 0;

  // Latest geometry for callbacks registered once (wheel listeners).
  const geo = useRef({ dims, fw, fh });
  geo.current = { dims, fw, fh };

  const updateAdj = useCallback((i, fn) => {
    setAdjs((prev) => {
      const cur = prev[i] || DEFAULT_ADJ;
      const { dims: d, fw: w, fh: h } = geo.current;
      return { ...prev, [i]: clampAdj(fn(cur), d[i], w, h) };
    });
  }, []);

  const onNatural = useCallback((i, nat) => {
    if (!nat.w || !nat.h) return;
    setDims((d) => (d[i] ? d : { ...d, [i]: nat }));
  }, []);

  // Re-clamp everything when the frame size changes or new dimensions arrive.
  useEffect(() => {
    setAdjs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        const c = clampAdj(prev[k], dims[k], fw, fh);
        if (c.x !== prev[k].x || c.y !== prev[k].y || c.s !== prev[k].s) {
          next[k] = c;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fw, fh, dims]);

  // Fit the A4 preview to the available width (never larger than 120%).
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return undefined;
    const pxPerMm = 96 / 25.4;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 16;
      setZoom(clamp(avail / (grid.pw * pxPerMm), 0.25, 1.2));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid.pw, loading]);

  function setSetting(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function choosePreset(presetId) {
    const p = PRESETS.find((x) => x.id === presetId);
    setSettings((s) => (p?.w ? { ...s, preset: presetId, frameW: p.w, frameH: p.h } : { ...s, preset: presetId }));
  }

  function resetAll() {
    setAdjs({});
  }

  const sel = clamp(selected, 0, Math.max(0, images.length - 1));
  const selAdj = adjs[sel] || DEFAULT_ADJ;
  const selNat = dims[sel];
  const selBox = selNat ? photoBox(selAdj, selNat, fw, fh) : null;
  const minScale = selBox ? Math.min(1, selBox.containScale) : 1;

  // Layout validation for custom sizes.
  const { w: pw, h: ph } = pageSize(settings.orientation);
  let layoutError = "";
  if (!(fw >= 10 && fh >= 10)) layoutError = "Frame width and height must be at least 10 mm.";
  else if (grid.perPage === 0)
    layoutError = `A ${fw} × ${fh} mm frame doesn't fit on an A4 ${settings.orientation} sheet with ${settings.margin} mm margins (${pw} × ${ph} mm).`;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton width={200} />
        <Skeleton variant="rounded" height={500} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!order) return <Alert severity="warning" sx={{ m: 3 }}>Order not found.</Alert>;

  const shortId = String(order._id).slice(-8);

  const printCss = `
    .ps-frame.has-cut { outline: 0.2mm solid #9ca3af; outline-offset: 0; }
    .ps-frame.is-selected { outline: 0.7mm solid #4f46e5; z-index: 2; }
    .ps-frame:active { cursor: grabbing; }
    .ps-index {
      position: absolute; top: 1.5mm; left: 1.5mm; min-width: 5mm; height: 5mm;
      padding: 0 1mm; border-radius: 2.5mm; background: rgba(15,23,42,.72); color: #fff;
      font: 600 2.6mm/5mm Inter, sans-serif; text-align: center; pointer-events: none;
    }
    @media print {
      @page { size: A4 ${settings.orientation}; margin: 0; }
      html, body, #root { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .ps-root { display: block !important; padding: 0 !important; background: #fff !important; }
      .ps-preview { padding: 0 !important; overflow: visible !important; background: #fff !important; }
      .ps-page-wrap { width: auto !important; height: auto !important; margin: 0 !important; box-shadow: none !important; }
      .ps-page {
        transform: none !important; box-shadow: none !important;
        height: ${ph - 0.5}mm !important; break-after: page; page-break-after: always;
      }
      .ps-page-wrap:last-child .ps-page { break-after: auto; page-break-after: auto; }
      .ps-frame.is-selected { outline: none; }
      .ps-frame.is-selected.has-cut { outline: 0.2mm solid #9ca3af; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  return (
    <Box className="ps-root" sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", bgcolor: "background.default" }}>
      <style>{printCss}</style>

      {/* ---------------- Controls ---------------- */}
      <Box
        className="no-print"
        sx={{
          width: { md: 340 },
          flexShrink: 0,
          p: 2,
          borderRight: { md: "1px solid" },
          borderBottom: { xs: "1px solid", md: "none" },
          borderColor: "divider",
          bgcolor: "background.paper",
          overflowY: { md: "auto" },
          maxHeight: { md: "100vh" },
          position: { md: "sticky" },
          top: 0,
        }}
      >
        <Link
          component={RouterLink}
          to={`/orders/${id}`}
          underline="hover"
          color="text.secondary"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
        >
          <ArrowBackIcon fontSize="small" /> Back to order
        </Link>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Print layout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Order #{shortId} · {images.length} photo{images.length === 1 ? "" : "s"} · {pages} A4 sheet{pages === 1 ? "" : "s"}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<PrintOutlinedIcon />}
          disabled={!!layoutError || images.length === 0}
          onClick={() => window.print()}
        >
          Print
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          In the print dialog choose paper <b>A4</b>, scale <b>100% / Actual size</b>, margins <b>None</b>, and turn off headers and footers. Otherwise the frames won't be exactly {fw} × {fh} mm.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Frame
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField select size="small" label="Frame size" value={settings.preset} onChange={(e) => choosePreset(e.target.value)}>
            {PRESETS.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              type="number"
              label="Width"
              value={settings.frameW}
              disabled={settings.preset !== "custom"}
              onChange={(e) => setSetting("frameW", num(e.target.value, 0))}
              inputProps={{ min: 10, max: 297, step: 1 }}
              InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
            />
            <TextField
              size="small"
              type="number"
              label="Height"
              value={settings.frameH}
              disabled={settings.preset !== "custom"}
              onChange={(e) => setSetting("frameH", num(e.target.value, 0))}
              inputProps={{ min: 10, max: 297, step: 1 }}
              InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              type="number"
              label="Page margin"
              value={settings.margin}
              onChange={(e) => setSetting("margin", clamp(num(e.target.value, 0), 0, 50))}
              inputProps={{ min: 0, max: 50, step: 0.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
            />
            <TextField
              size="small"
              type="number"
              label="Gap"
              value={settings.gap}
              onChange={(e) => setSetting("gap", clamp(num(e.target.value, 0), 0, 30))}
              inputProps={{ min: 0, max: 30, step: 0.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
            />
          </Stack>
          <ToggleButtonGroup
            size="small"
            exclusive
            fullWidth
            value={settings.orientation}
            onChange={(_, v) => v && setSetting("orientation", v)}
          >
            <ToggleButton value="portrait">A4 portrait</ToggleButton>
            <ToggleButton value="landscape">A4 landscape</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={<Switch checked={settings.cutLines} onChange={(e) => setSetting("cutLines", e.target.checked)} />}
            label={<Typography variant="body2">Print thin cut lines</Typography>}
          />
          {layoutError ? (
            <Alert severity="error">{layoutError}</Alert>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {grid.cols} × {grid.rows} = <b>{grid.perPage}</b> frames per sheet
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Photo {images.length ? sel + 1 : "—"}
        </Typography>
        {images.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No photos on this order.
          </Typography>
        ) : (
          <Card variant="outlined" sx={{ mt: 1 }}>
            <CardContent sx={{ "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Click a frame to select it. Drag the photo to move it; scroll (or pinch) on the selected frame to zoom. The frame stays {fw} × {fh} mm.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={() => updateAdj(sel, (a) => ({ ...a, s: a.s / 1.1 }))}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Slider
                  size="small"
                  min={minScale}
                  max={MAX_SCALE}
                  step={0.01}
                  value={clamp(selAdj.s, minScale, MAX_SCALE)}
                  disabled={!selNat}
                  onChange={(_, v) => updateAdj(sel, (a) => ({ ...a, s: v }))}
                />
                <IconButton size="small" onClick={() => updateAdj(sel, (a) => ({ ...a, s: a.s * 1.1 }))}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Size {Math.round(selAdj.s * 100)}%
              </Typography>
              <ButtonGroup size="small" fullWidth variant="outlined" sx={{ mt: 1.5 }}>
                <Tooltip title="Photo fills the whole frame">
                  <Button startIcon={<CropFreeIcon />} onClick={() => updateAdj(sel, (a) => ({ ...a, s: 1, x: 0, y: 0 }))}>
                    Fill
                  </Button>
                </Tooltip>
                <Tooltip title="Whole photo visible, white edges">
                  <Button
                    startIcon={<FitScreenOutlinedIcon />}
                    disabled={!selBox}
                    onClick={() => updateAdj(sel, (a) => ({ ...a, s: selBox.containScale, x: 0, y: 0 }))}
                  >
                    Fit
                  </Button>
                </Tooltip>
                <Tooltip title="Rotate 90°">
                  <Button startIcon={<RotateRightIcon />} onClick={() => updateAdj(sel, (a) => ({ ...a, r: ((a.r || 0) + 90) % 360, s: 1, x: 0, y: 0 }))}>
                    Rotate
                  </Button>
                </Tooltip>
              </ButtonGroup>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" color="inherit" disabled={sel === 0} onClick={() => setSelected(sel - 1)}>
                  ‹ Prev
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" color="inherit" disabled={sel >= images.length - 1} onClick={() => setSelected(sel + 1)}>
                  Next ›
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Button fullWidth size="small" color="inherit" startIcon={<RestartAltIcon />} sx={{ mt: 2 }} onClick={resetAll}>
          Reset all photos
        </Button>
      </Box>

      {/* ---------------- A4 preview ---------------- */}
      <Box
        ref={previewRef}
        className="ps-preview"
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1, sm: 3 }, bgcolor: "#e2e8f0", overflowX: "hidden" }}
      >
        {!layoutError &&
          Array.from({ length: pages }).map((_, p) => (
            <Box
              key={p}
              className="ps-page-wrap"
              sx={{
                width: `calc(${grid.pw}mm * ${zoom})`,
                height: `calc(${grid.ph}mm * ${zoom})`,
                mx: "auto",
                mb: 3,
                boxShadow: "0 2px 12px rgba(15,23,42,.18)",
              }}
            >
              <div
                className="ps-page"
                style={{
                  position: "relative",
                  width: `${grid.pw}mm`,
                  height: `${grid.ph}mm`,
                  background: "#fff",
                  overflow: "hidden",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                {images.slice(p * grid.perPage, (p + 1) * grid.perPage).map((img, j) => {
                  const i = p * grid.perPage + j;
                  const col = j % grid.cols;
                  const row = Math.floor(j / grid.cols);
                  return (
                    <Frame
                      key={i}
                      index={i}
                      src={imageSrc(img)}
                      adj={adjs[i] || DEFAULT_ADJ}
                      nat={dims[i]}
                      fw={fw}
                      fh={fh}
                      left={grid.offX + col * (fw + settings.gap)}
                      top={grid.offY + row * (fh + settings.gap)}
                      selected={i === sel}
                      cutLines={settings.cutLines}
                      onSelect={setSelected}
                      onChange={updateAdj}
                      onNatural={onNatural}
                    />
                  );
                })}
              </div>
            </Box>
          ))}
        {!layoutError && pages > 0 && (
          <Typography className="no-print" variant="caption" color="text.secondary" display="block" textAlign="center">
            Preview at {Math.round(zoom * 100)}% · prints at actual size
          </Typography>
        )}
      </Box>
    </Box>
  );
}
