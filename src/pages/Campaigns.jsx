import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { api } from "../api.js";
import { PageHeader, TableSkeleton } from "../components/ui.jsx";

const STATUS = {
  draft: { label: "Draft", color: "default" },
  sending: { label: "Sending", color: "info" },
  paused: { label: "Paused", color: "warning" },
  sent: { label: "Sent", color: "success" },
};

const AUDIENCE_LABEL = { all: "All users", buyers: "Buyers", nonBuyers: "Never bought", custom: "Custom list" };

export function CampaignStatusChip({ status }) {
  const s = STATUS[status] || STATUS.draft;
  return <Chip size="small" label={s.label} color={s.color} variant={status === "sent" ? "filled" : "outlined"} sx={{ fontWeight: 600 }} />;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api("/api/campaigns"), api("/api/campaigns/meta")])
      .then(([c, m]) => {
        setCampaigns(c.campaigns || []);
        setMeta(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function create() {
    setCreating(true);
    try {
      const d = await api("/api/campaigns", { method: "POST", body: JSON.stringify({ name: "Untitled campaign" }) });
      navigate(`/campaigns/${d.campaign._id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  async function duplicate(c, e) {
    e.stopPropagation();
    try {
      const d = await api(`/api/campaigns/${c._id}/duplicate`, { method: "POST" });
      navigate(`/campaigns/${d.campaign._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(c, e) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try {
      await api(`/api/campaigns/${c._id}`, { method: "DELETE" });
      setCampaigns((list) => list.filter((x) => x._id !== c._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Email campaigns"
        subtitle={meta ? `${meta.unsubscribed} unsubscribed address${meta.unsubscribed === 1 ? "" : "es"} are always skipped.` : "Broadcast emails to your customers."}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={create} disabled={creating}>
            New campaign
          </Button>
        }
      />
      {meta && !meta.mailConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Email isn't set up on the server (MAIL_USER / APPPASSCODE). You can write campaigns but not send them.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Card>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ width: 200 }}>Delivered</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No campaigns yet. Create one to email your customers.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => {
                  const total = c.stats?.total || 0;
                  const done = (c.stats?.sent || 0) + (c.stats?.failed || 0) + (c.stats?.skipped || 0);
                  return (
                    <TableRow key={c._id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/campaigns/${c._id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 320 }}>
                          {c.subject || "No subject yet"}
                        </Typography>
                      </TableCell>
                      <TableCell>{AUDIENCE_LABEL[c.audience?.type] || "All users"}</TableCell>
                      <TableCell><CampaignStatusChip status={c.status} /></TableCell>
                      <TableCell>
                        {total ? (
                          <Stack spacing={0.5}>
                            <LinearProgress variant="determinate" value={(done / total) * 100} sx={{ height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" color="text.secondary">
                              {c.stats.sent}/{total} sent{c.stats.failed ? ` · ${c.stats.failed} failed` : ""}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.finishedAt || c.updatedAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={(e) => duplicate(c, e)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={c.status === "sending" ? "Pause it first" : "Delete"}>
                          <span>
                            <IconButton size="small" disabled={c.status === "sending"} onClick={(e) => remove(c, e)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
