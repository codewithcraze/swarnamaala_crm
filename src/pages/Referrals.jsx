import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Skeleton,
  Chip,
} from "@mui/material";
import { api } from "../api.js";
import { PageHeader, StatusChip, TableSkeleton, RS } from "../components/ui.jsx";

function MetricCard({ label, value }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Referrals() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // client-side pagination for the two tables
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRpp, setOrdersRpp] = useState(10);

  useEffect(() => {
    api("/api/referrals")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;

  const loading = !data;
  const earners = data?.earners ?? [];
  const referralOrders = data?.referralOrders ?? [];
  const totalPaid = earners.reduce((s, e) => s + (e.walletBalance || 0), 0);

  const pagedOrders = referralOrders.slice(
    ordersPage * ordersRpp,
    ordersPage * ordersRpp + ordersRpp
  );

  return (
    <Box>
      <PageHeader
        title="Referrals"
        subtitle="Top referrers and their earnings from the referral program."
      />

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}>
          {loading ? (
            <Skeleton variant="rounded" height={90} />
          ) : (
            <MetricCard label="Referrers earning" value={earners.length} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          {loading ? (
            <Skeleton variant="rounded" height={90} />
          ) : (
            <MetricCard label="Total credited payouts" value={`${RS}${totalPaid}`} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          {loading ? (
            <Skeleton variant="rounded" height={90} />
          ) : (
            <MetricCard label="Referral orders" value={referralOrders.length} />
          )}
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>
        Top earners
      </Typography>
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 640 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right">Friends joined</TableCell>
                <TableCell align="right">Wallet balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : earners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No referral earnings yet.
                  </TableCell>
                </TableRow>
              ) : (
                earners.map((e) => (
                  <TableRow key={e._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{e.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {e.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {e.referralCode ? (
                        <Chip size="small" variant="outlined" label={e.referralCode} sx={{ fontFamily: "monospace" }} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell align="right">{e.referredCount}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {RS}
                      {e.walletBalance}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>
        Referral orders
      </Typography>
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 640 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Referrer</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell align="right">Reward</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Credited</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : referralOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No referral orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((o) => (
                  <TableRow key={o._id} hover>
                    <TableCell>{o.referrer?.name || "—"}</TableCell>
                    <TableCell>{o.user?.name || "—"}</TableCell>
                    <TableCell align="right">
                      {RS}
                      {o.referralReward}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={o.status} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={o.referralCredited ? "delivered" : "pending"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && referralOrders.length > 0 && (
          <TablePagination
            component="div"
            count={referralOrders.length}
            page={ordersPage}
            onPageChange={(_e, p) => setOrdersPage(p)}
            rowsPerPage={ordersRpp}
            onRowsPerPageChange={(e) => {
              setOrdersRpp(parseInt(e.target.value, 10));
              setOrdersPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Card>
    </Box>
  );
}
