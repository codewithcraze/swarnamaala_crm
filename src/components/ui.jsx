import { Chip, Box, Typography, Skeleton, TableRow, TableCell } from "@mui/material";

export const RS = "\u20B9";

// Map order/payment status -> MUI chip color + label.
const STATUS_COLOR = {
  pending: "warning",
  processing: "info",
  shipped: "secondary",
  delivered: "success",
  cancelled: "error",
};

const PAYMENT_COLOR = {
  unpaid: "warning",
  paid: "success",
  failed: "error",
  refunded: "default",
};

export function StatusChip({ status }) {
  const s = status || "pending";
  return (
    <Chip
      size="small"
      label={s}
      color={STATUS_COLOR[s] || "default"}
      variant="outlined"
      sx={{ textTransform: "capitalize", fontWeight: 600 }}
    />
  );
}

export function PaymentChip({ status }) {
  const s = status || "unpaid";
  return (
    <Chip
      size="small"
      label={s}
      color={PAYMENT_COLOR[s] || "default"}
      variant={s === "paid" ? "filled" : "outlined"}
      sx={{ textTransform: "capitalize", fontWeight: 600 }}
    />
  );
}

// Page header: title + optional subtitle + optional right-side action slot.
export function PageHeader({ title, subtitle, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

// Loading skeleton rows for tables.
export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton variant="text" width={c === 0 ? "70%" : "50%"} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
