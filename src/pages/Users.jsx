import { useEffect, useState } from "react";
import { api } from "../api.js";

const RS = "\u20B9";

function formatDay(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Users() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/users")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="page-sub">Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <p className="page-sub">
        {data.total} registered users, grouped by the day they signed up.
      </p>

      {data.daywise.length === 0 && <div className="card">No users yet.</div>}

      {data.daywise.map((group) => (
        <div key={group.date}>
          <div className="day-header">
            {formatDay(group.date)}
            <span className="count">{group.count} joined</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Referral code</th>
                  <th>Wallet</th>
                </tr>
              </thead>
              <tbody>
                {group.users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || "—"}</td>
                    <td>{u.referralCode || "—"}</td>
                    <td>
                      {RS}
                      {u.walletBalance ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
