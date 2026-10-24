import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Skeleton,
  Avatar,
} from "@mui/material";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { api } from "../api.js";
import { PageHeader, RS } from "../components/ui.jsx";

function StatCard({ label, value, icon, color }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          variant="rounded"
          sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 48, height: 48 }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function CountCard({ label, value, highlight }) {
  return (
    <Card sx={{ height: "100%", ...(highlight ? { borderColor: "error.main" } : {}) }}>
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textTransform: "capitalize" }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mt: 0.5, color: highlight ? "error.main" : "text.primary" }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;

  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const paymentStatuses = ["unpaid", "paid", "failed", "refunded"];

  const cards = stats
    ? [
        { label: "Total users", value: stats.users, icon: <PeopleOutlinedIcon />, color: "info" },
        { label: "Total orders", value: stats.orders, icon: <Inventory2OutlinedIcon />, color: "secondary" },
        { label: "Revenue", value: `${RS}${stats.revenue}`, icon: <PaidOutlinedIcon />, color: "success" },
        { label: "Referral payouts", value: `${RS}${stats.referralPayouts}`, icon: <CardGiftcardOutlinedIcon />, color: "warning" },
      ]
    : [];

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your store performance." />

      <Grid container spacing={2}>
        {stats
          ? cards.map((c) => (
              <Grid item xs={12} sm={6} md={3} key={c.label}>
                <StatCard {...c} />
              </Grid>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Skeleton variant="rounded" width={48} height={48} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" height={32} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>
        Orders by status
      </Typography>
      <Grid container spacing={2}>
        {statuses.map((s) => (
          <Grid item xs={6} sm={4} md={2.4} key={s}>
            {stats ? (
              <CountCard label={s} value={stats.statusCounts?.[s] ?? 0} />
            ) : (
              <Skeleton variant="rounded" height={90} />
            )}
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>
        Payment status
      </Typography>
      <Grid container spacing={2}>
        {paymentStatuses.map((p) => (
          <Grid item xs={6} sm={3} key={p}>
            {stats ? (
              <CountCard
                label={p}
                value={stats.paymentStatusCounts?.[p] ?? 0}
                highlight={p === "failed"}
              />
            ) : (
              <Skeleton variant="rounded" height={90} />
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
