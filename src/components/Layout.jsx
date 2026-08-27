import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { setToken } from "../api.js";
import Logo from "./Logo.jsx";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/users", label: "Users" },
  { to: "/orders", label: "Orders" },
  { to: "/referrals", label: "Referrals" },
  { to: "/coupons", label: "Coupons" },
  { to: "/blogs", label: "Blog" },
];

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    setToken(null);
    navigate("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ padding: "6px 10px 18px" }}>
          <Logo />
        </div>
        <nav>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
            >
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="btn ghost" style={{ marginTop: 16, width: "100%" }} onClick={logout}>
          Sign out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
