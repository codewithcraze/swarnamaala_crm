import { useEffect, useState } from "react";
import { api } from "../api.js";

const RS = "\u20B9";

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: "",
  maxDiscount: "",
  minOrderValue: "",
  usageLimit: "",
  expiresAt: "",
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    api("/api/coupons")
      .then((d) => setCoupons(d.coupons))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function generate(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase() || undefined,
        type: form.type,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
        expiresAt: form.expiresAt || null,
      };
      const { coupon } = await api("/api/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCoupons((prev) => [coupon, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c) {
    setBusyId(c._id);
    try {
      const { coupon } = await api(`/api/coupons/${c._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !c.active }),
      });
      setCoupons((prev) => prev.map((x) => (x._id === c._id ? coupon : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    setBusyId(c._id);
    try {
      await api(`/api/coupons/${c._id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((x) => x._id !== c._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
  }

  function discountLabel(c) {
    return c.type === "percent" ? `${c.value}% off` : `${RS}${c.value} off`;
  }

  function isExpired(c) {
    return c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
  }

  return (
    <div>
      <h1 className="page-title">Coupons</h1>
      <p className="page-sub">Generate discount codes customers can apply at checkout.</p>

      {/* Generate form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>Generate a coupon</h2>
        <form onSubmit={generate}>
          <div className="grid cols-4" style={{ gap: 14 }}>
            <div>
              <label className="field-label">Type</label>
              <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat amount ({RS})</option>
              </select>
            </div>
            <div>
              <label className="field-label">
                {form.type === "percent" ? "Percent off (1–100)" : `Amount off (${RS})`}
              </label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "percent" ? "10" : "50"}
                required
              />
            </div>
            {form.type === "percent" && (
              <div>
                <label className="field-label">Max discount ({RS}, optional)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => set("maxDiscount", e.target.value)}
                  placeholder="No cap"
                />
              </div>
            )}
            <div>
              <label className="field-label">Min order ({RS}, optional)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.minOrderValue}
                onChange={(e) => set("minOrderValue", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="field-label">Usage limit (optional)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="field-label">Expires on (optional)</label>
              <input
                className="input"
                type="date"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Code (optional)</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="Auto-generate"
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
          {formError && <div className="error" style={{ marginTop: 12 }}>{formError}</div>}
          <button className="btn" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? "Generating…" : "Generate coupon"}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <p className="page-sub">Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = isExpired(c);
                return (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <b style={{ letterSpacing: 0.5 }}>{c.code}</b>
                        <button className="btn ghost" style={{ padding: "2px 8px", fontSize: 11 }}
                          onClick={() => copyCode(c.code)}>copy</button>
                      </div>
                    </td>
                    <td>{discountLabel(c)}</td>
                    <td>
                      <div className="stat-label">
                        {c.type === "percent" && c.maxDiscount > 0 && <div>Max {RS}{c.maxDiscount}</div>}
                        {c.minOrderValue > 0 && <div>Min order {RS}{c.minOrderValue}</div>}
                        {(!c.maxDiscount && !c.minOrderValue) && "—"}
                      </div>
                    </td>
                    <td>
                      {c.usedCount || 0}
                      {c.usageLimit > 0 ? ` / ${c.usageLimit}` : " / ∞"}
                    </td>
                    <td className="stat-label">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td>
                      {expired ? (
                        <span className="badge cancelled">expired</span>
                      ) : c.active ? (
                        <span className="badge delivered">active</span>
                      ) : (
                        <span className="badge pending">inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn ghost"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          disabled={busyId === c._id || expired}
                          onClick={() => toggleActive(c)}
                        >
                          {c.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="btn ghost"
                          style={{ padding: "6px 10px", fontSize: 12, color: "#b91c1c" }}
                          disabled={busyId === c._id}
                          onClick={() => remove(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                    No coupons yet. Generate one above.
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
