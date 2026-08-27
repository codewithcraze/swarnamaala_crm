import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, downloadBlob } from "../api.js";

const RS = "\u20B9";
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "paid", "failed", "refunded"];

const SITE_URL = import.meta.env.VITE_SITE_URL || "";

function imageSrc(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : url;
}

function fmt(d) {
  return d ? new Date(d).toLocaleString() : "—";
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function load() {
    setLoading(true);
    api(`/api/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        setNote(d.order.adminNote || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status) {
    setBusy(true);
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrder((o) => ({ ...o, status }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updatePayment(paymentStatus) {
    setBusy(true);
    try {
      await api(`/api/orders/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setOrder((o) => ({ ...o, paymentStatus }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      await api(`/api/orders/${id}/note`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote: note }),
      });
      setOrder((o) => ({ ...o, adminNote: note }));
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch (e) {
      alert(e.message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function downloadAll() {
    setDownloading(true);
    try {
      const shortId = String(order._id).slice(-8);
      await downloadBlob(`/api/orders/${id}/images.zip`, `order-${shortId}-photos.zip`);
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <p className="page-sub">Loading...</p>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">Order not found.</div>;

  const images = order.images || [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/orders" className="stat-label">
          &larr; Back to orders
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Order #{String(order._id).slice(-8)}
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Placed {fmt(order.createdAt)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${order.paymentStatus || "unpaid"}`}>
            {order.paymentStatus || "unpaid"}
          </span>
          <span className={`badge ${order.status || "pending"}`}>{order.status || "pending"}</span>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 20, alignItems: "start" }}>
        {/* LEFT: customer + shipping + pricing */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <div className="stat-label" style={{ marginBottom: 8, fontWeight: 700 }}>Customer</div>
            <div style={{ fontWeight: 600 }}>{order.user?.name || "—"}</div>
            <div className="stat-label">{order.user?.email}</div>
            <div className="stat-label">{order.shippingAddress?.phone || order.user?.phone}</div>
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: 8, fontWeight: 700 }}>Ship to</div>
            <div>{order.shippingAddress?.fullName}</div>
            <div className="stat-label">{order.shippingAddress?.line1}</div>
            {order.shippingAddress?.line2 && (
              <div className="stat-label">{order.shippingAddress.line2}</div>
            )}
            <div className="stat-label">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
              {order.shippingAddress?.pincode}
            </div>
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: 8, fontWeight: 700 }}>Payment</div>
            <div className="stat-label">
              Total <b style={{ color: "var(--charcoal)" }}>{RS}{order.total ?? order.amount}</b>{" "}
              ({RS}{order.subtotal ?? "—"} + {RS}{order.gst ?? 0} GST)
            </div>
            {order.discount > 0 && (
              <div className="stat-label" style={{ color: "#15803d", marginTop: 4 }}>
                Coupon {order.couponCode ? <b>{order.couponCode}</b> : null} · saved {RS}{order.discount}
              </div>
            )}
            {order.razorpayPaymentId && (
              <div className="stat-label" style={{ marginTop: 6 }}>
                Payment ID: <b style={{ color: "var(--charcoal)" }}>{order.razorpayPaymentId}</b>
              </div>
            )}
            {order.razorpayOrderId && (
              <div className="stat-label">Rzp order: {order.razorpayOrderId}</div>
            )}
            {order.paidAt && <div className="stat-label">Paid: {fmt(order.paidAt)}</div>}
            {order.paymentStatus === "failed" && (
              <div className="stat-label" style={{ color: "#c2410c", marginTop: 6 }}>
                {order.paymentFailureReason}
                {order.paymentFailedAt && <div>Failed: {fmt(order.paymentFailedAt)}</div>}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: items + controls + note */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <div className="stat-label" style={{ marginBottom: 8, fontWeight: 700 }}>Item</div>
            <div style={{ fontWeight: 600 }}>{order.product || "Custom Photo Magnet"}</div>
            <div className="stat-label">{order.unitLabel} · Qty {order.quantity}</div>
            {order.note && (
              <div style={{ marginTop: 10 }}>
                <div className="stat-label">Customer note:</div>
                <div style={{ fontSize: 14 }}>{order.note}</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: 10, fontWeight: 700 }}>Update</div>
            <label className="field-label">Order status</label>
            <select
              className="input"
              value={order.status || "pending"}
              disabled={busy}
              onChange={(e) => updateStatus(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="field-label">Payment status</label>
            <select
              className="input"
              value={order.paymentStatus || "unpaid"}
              disabled={busy}
              onChange={(e) => updatePayment(e.target.value)}
            >
              {PAYMENTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: 10, fontWeight: 700 }}>Internal note</div>
            <textarea
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note about this order (not visible to the customer)…"
              style={{ minHeight: 120 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <button className="btn" onClick={saveNote} disabled={noteSaving}>
                {noteSaving ? "Saving…" : "Save note"}
              </button>
              {noteSaved && <span className="stat-label" style={{ color: "#15803d" }}>Saved ✓</span>}
            </div>
          </div>
        </div>

        {/* RIGHT: referral + photos */}
        <div style={{ display: "grid", gap: 16 }}>
          {order.referrer && (
            <div className="card">
              <div className="stat-label" style={{ marginBottom: 8, fontWeight: 700 }}>Referral</div>
              <div>{order.referrer?.name}</div>
              <div className="stat-label">{order.referrer?.email}</div>
              <span className={`badge ${order.referralCredited ? "delivered" : "pending"}`} style={{ marginTop: 6 }}>
                {order.referralCredited ? "credited" : "pending"} {RS}{order.referralReward}
              </span>
            </div>
          )}

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="stat-label" style={{ fontWeight: 700 }}>
                Photos ({images.length})
              </div>
              {images.length > 0 && (
                <button className="btn" onClick={downloadAll} disabled={downloading}>
                  {downloading ? "Preparing…" : "Download all (ZIP)"}
                </button>
              )}
            </div>
            {images.length === 0 ? (
              <p className="stat-label">No photos on this order.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                {images.map((img, i) => {
                  const src = imageSrc(img);
                  return (
                    <a key={i} href={src} target="_blank" rel="noreferrer" title={`Open photo ${i + 1}`}>
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }}
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
