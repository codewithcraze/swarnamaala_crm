import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api("/api/blogs")
      .then((d) => setBlogs(d.blogs))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    try {
      await api(`/api/blogs/${id}`, { method: "DELETE" });
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Blog</h1>
          <p className="page-sub">Create and manage blog posts shown on the website.</p>
        </div>
        <Link className="btn" to="/blogs/new">
          + New post
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <p className="page-sub">Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600 }}>{b.title}</td>
                  <td className="stat-label">/blog/{b.slug}</td>
                  <td>
                    <span className={`badge ${b.published ? "delivered" : "pending"}`}>
                      {b.published ? "published" : "draft"}
                    </span>
                  </td>
                  <td className="stat-label">
                    {new Date(b.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link className="btn ghost" to={`/blogs/${b._id}`} style={{ marginRight: 8 }}>
                      Edit
                    </Link>
                    <button className="btn ghost" onClick={() => remove(b._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                    No blog posts yet. Create your first one!
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
