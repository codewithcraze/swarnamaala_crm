import { useEffect, useState } from "react";
import { api } from "../api.js";

const RS = "\u20B9";

export default function Referrals() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/referrals")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="page-sub">Loading...</p>;

  const totalPaid = data.earners.reduce((s, e) => s + (e.walletBalance || 0), 0);

  return (
    <div>
      <h1 className="page-title">Referrals</h1>
      <p className="page-sub">Top referrers and their earnings from the referral program.</p>

      <div className="grid cols-3">
        <div className="card">
          <div className="stat-label">Total referrers earning</div>
          <div className="stat-value">{data.earners.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Total credited payouts</div>
          <div className="stat-value">
            {RS}
            {totalPaid}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Referral orders</div>
          <div className="stat-value">{data.referralOrders.length}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 28, fontSize: 18 }}>Top earners</h2>
      <div className="card" style={{ padding: 0, overflow: "auto", marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Code</th>
              <th>Friends joined</th>
              <th>Wallet balance</th>
            </tr>
          </thead>
          <tbody>
            {data.earners.map((e) => (
              <tr key={e._id}>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{e.referralCode || "—"}</td>
                <td>{e.referredCount}</td>
                <td>
                  <b>
                    {RS}
                    {e.walletBalance}
                  </b>
                </td>
              </tr>
            ))}
            {data.earners.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                  No referral earnings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 28, fontSize: 18 }}>Referral orders</h2>
      <div className="card" style={{ padding: 0, overflow: "auto", marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Buyer</th>
              <th>Reward</th>
              <th>Status</th>
              <th>Credited</th>
            </tr>
          </thead>
          <tbody>
            {data.referralOrders.map((o) => (
              <tr key={o._id}>
                <td>{o.referrer?.name || "—"}</td>
                <td>{o.user?.name || "—"}</td>
                <td>
                  {RS}
                  {o.referralReward}
                </td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
                <td>
                  <span className={`badge ${o.referralCredited ? "delivered" : "pending"}`}>
                    {o.referralCredited ? "yes" : "no"}
                  </span>
                </td>
              </tr>
            ))}
            {data.referralOrders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                  No referral orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
