import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Alert,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { DeleteUserDialog, EditCustomerDialog, ResetPasswordDialog } from "../components/OrderDialogs.jsx";
import SearchIcon from "@mui/icons-material/Search";
import { api } from "../api.js";
import { PageHeader, TableSkeleton, RS } from "../components/ui.jsx";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const [toReset, setToReset] = useState(null);
  const [toast, setToast] = useState("");

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page + 1));
    params.set("limit", String(rowsPerPage));
    if (debounced) params.set("search", debounced);
    api(`/api/users?${params.toString()}`)
      .then((d) => {
        setUsers(d.users);
        setTotal(d.total ?? d.users.length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle={`${total} registered user${total === 1 ? "" : "s"}.`}
      />

      <TextField
        size="small"
        placeholder="Search by name, email, phone or code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 720 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Referral code</TableCell>
                <TableCell>Wallet</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={rowsPerPage > 10 ? 8 : rowsPerPage} cols={7} />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell>
                      {u.referralCode ? (
                        <Chip
                          size="small"
                          label={u.referralCode}
                          variant="outlined"
                          sx={{ fontFamily: "monospace" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {RS}
                      {u.walletBalance ?? 0}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(u.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit user">
                        <IconButton size="small" onClick={() => setToEdit(u)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.role === "admin" ? (
                        <Chip size="small" label="Admin" variant="outlined" sx={{ ml: 0.5 }} />
                      ) : (
                        <>
                          <Tooltip title="Reset password & email it">
                            <IconButton size="small" color="warning" onClick={() => setToReset(u)}>
                              <LockResetOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton size="small" color="error" onClick={() => setToDelete(u)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      <DeleteUserDialog
        open={!!toDelete}
        user={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(d) => {
          setToast(
            d.deletedOrders
              ? `User deleted with ${d.deletedOrders} order${d.deletedOrders === 1 ? "" : "s"}.`
              : "User deleted."
          );
          setToDelete(null);
          // Step back a page if this was the last row on it.
          if (users.length === 1 && page > 0) setPage(page - 1);
          else load();
        }}
      />
      <EditCustomerDialog
        open={!!toEdit}
        user={toEdit}
        onClose={() => setToEdit(null)}
        onSaved={(saved) => {
          setUsers((list) => list.map((x) => (x._id === saved._id ? { ...x, ...saved } : x)));
          setToEdit(null);
          setToast("User details saved.");
        }}
      />
      <ResetPasswordDialog
        open={!!toReset}
        user={toReset}
        onClose={() => setToReset(null)}
        onDone={(email) => {
          setToReset(null);
          setToast(`New password emailed to ${email}.`);
        }}
      />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}
