import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const RS = "\u20B9";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];

// Uploaded images are proxied by the main site (/api/images/...). Show them via
// the site origin if configured, otherwise skip the thumbnail.
const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function imageSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : null;
}

function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

const copyBtnStyle = {
  border: "1px solid var(--line)",
  background: "#fff",
  borderRadius: 6,
  padding: "0 6px",
  fontSize: 10,
  cursor: "pointer",
  color: "var(--muted)",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    const qs = params.toString();
    api(`/api/orders${qs ? `?${qs}` : ""}`)
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, paymentFilter]);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function updatePayment(id, paymentStatus) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, paymentStatus } : o))
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Orders</h1>
      <p className="page-sub">
        Manage orders. Marking an order <b>delivered</b> credits the referrer&apos;s wallet.
      </p>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="stat-label">Status:</label>
        <select
          className="input"
          style={{ width: 160 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="stat-label">Payment:</label>
        <select
          className="input"
          style={{ width: 160 }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All payments</option>
          {PAYMENTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <p className="page-sub">Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Photos</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Ship to</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Referral</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const thumb = imageSrc(o.images?.[0]);
                return (
                  <tr key={o._id}>
                    <td>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {thumb ? (
                          <img className="thumb" src={thumb} alt="" />
                        ) : (
                          <div className="thumb" style={{ display: "grid", placeItems: "center" }}>
                            {o.images?.length || 0}
                          </div>
                        )}
                        {o.images?.length > 1 && (
                          <span className="stat-label">+{o.images.length - 1}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.user?.name || "—"}</div>
                      <div className="stat-label">{o.user?.email}</div>
                      <div className="stat-label">{o.shippingAddress?.phone}</div>
                    </td>
                    <td>
                      {o.unitLabel}
                      <div className="stat-label">Qty {o.quantity}</div>
                    </td>
                    <td>
                      <b>
                        {RS}
                        {o.total ?? o.amount}
                      </b>
                      <div className="stat-label">
                        {RS}
                        {o.subtotal ?? "—"} + {RS}
                        {o.gst ?? 0} GST
                      </div>
                      {o.discount > 0 && (
                        <div className="stat-label" style={{ color: "#15803d" }}>
                          {o.couponCode ? `${o.couponCode}: ` : ""}−{RS}{o.discount}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div className="stat-label">
                        {o.shippingAddress?.city}, {o.shippingAddress?.state} -{" "}
                        {o.shippingAddress?.pincode}
                      </div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span className={`badge ${o.paymentStatus || "unpaid"}`}>
                          {o.paymentStatus || "unpaid"}
                        </span>
                      </div>
                      <select
                        className="status-select"
                        value={o.paymentStatus || "unpaid"}
                        disabled={busyId === o._id}
                        onChange={(e) => updatePayment(o._id, e.target.value)}
                      >
                        {PAYMENTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      {/* Successful payment: show Razorpay payment id + paid time */}
                      {o.paymentStatus === "paid" && (
                        <div className="stat-label" style={{ marginTop: 6, fontSize: 11, lineHeight: 1.5 }}>
                          {o.razorpayPaymentId && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ color: "#15803d", fontWeight: 600 }}>
                                {o.razorpayPaymentId}
                              </span>
                              <button
                                type="button"
                                title="Copy payment ID"
                                onClick={() => copyText(o.razorpayPaymentId)}
                                style={copyBtnStyle}
                              >
                                copy
                              </button>
                            </div>
                          )}
                          {o.razorpayOrderId && (
                            <div style={{ color: "var(--muted)" }}>ord: {o.razorpayOrderId}</div>
                          )}
                          {o.paidAt && <div>{new Date(o.paidAt).toLocaleString()}</div>}
                        </div>
                      )}

                      {/* Failed payment: show reason + failed time + rzp ids if any */}
                      {o.paymentStatus === "failed" && (
                        <div className="stat-label" style={{ color: "#c2410c", marginTop: 6, fontSize: 11, lineHeight: 1.5 }}>
                          {o.paymentFailureReason && (
                            <div title={o.paymentFailureReason}>
                              {o.paymentFailureReason.length > 40
                                ? o.paymentFailureReason.slice(0, 40) + "…"
                                : o.paymentFailureReason}
                            </div>
                          )}
                          {o.razorpayPaymentId && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>{o.razorpayPaymentId}</span>
                              <button
                                type="button"
                                title="Copy payment ID"
                                onClick={() => copyText(o.razorpayPaymentId)}
                                style={copyBtnStyle}
                              >
                                copy
                              </button>
                            </div>
                          )}
                          {o.paymentFailedAt && (
                            <div>{new Date(o.paymentFailedAt).toLocaleString()}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={o.status || "pending"}
                        disabled={busyId === o._id}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {o.referrer ? (
                        <div>
                          <div className="stat-label">{o.referrer?.name}</div>
                          <span className={`badge ${o.referralCredited ? "delivered" : "pending"}`}>
                            {o.referralCredited ? "credited" : "pending"} {RS}
                            {o.referralReward}
                          </span>
                        </div>
                      ) : (
                        <span className="stat-label">—</span>
                      )}
                    </td>
                    <td>
                      <Link className="btn ghost" to={`/orders/${o._id}`} style={{ padding: "6px 12px", fontSize: 13 }}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)" }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
