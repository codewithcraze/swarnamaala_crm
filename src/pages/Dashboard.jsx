import { useEffect, useState } from "react";
import { api } from "../api.js";

const RS = "\u20B9";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!stats) return <p className="page-sub">Loading...</p>;

  const cards = [
    { label: "Total users", value: stats.users },
    { label: "Total orders", value: stats.orders },
    { label: "Revenue (excl. cancelled)", value: `${RS}${stats.revenue}` },
    { label: "Referral payouts", value: `${RS}${stats.referralPayouts}` },
  ];

  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const paymentStatuses = ["unpaid", "paid", "failed", "refunded"];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Overview of your store performance.</p>

      <div className="grid cols-4">
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 28, fontSize: 18 }}>Orders by status</h2>
      <div className="grid cols-4" style={{ marginTop: 12 }}>
        {statuses.map((s) => (
          <div className="card" key={s}>
            <div className="stat-label" style={{ textTransform: "capitalize" }}>{s}</div>
            <div className="stat-value" style={{ fontSize: 24 }}>
              {stats.statusCounts?.[s] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 28, fontSize: 18 }}>Payment status</h2>
      <div className="grid cols-4" style={{ marginTop: 12 }}>
        {paymentStatuses.map((p) => (
          <div className="card" key={p} style={p === "failed" ? { borderLeft: "3px solid #f97316" } : {}}>
            <div className="stat-label" style={{ textTransform: "capitalize" }}>{p}</div>
            <div className="stat-value" style={{ fontSize: 24, color: p === "failed" ? "#c2410c" : undefined }}>
              {stats.paymentStatusCounts?.[p] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
