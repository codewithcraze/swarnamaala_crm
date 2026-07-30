import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, uploadFile } from "../api.js";
import RichTextEditor from "../components/RichTextEditor.jsx";

const EMPTY = {
  title: "",
  slug: "",
  description: "",
  content: "",
  coverImage: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  author: "swarnamaala.in",
  published: true,
};

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    api(`/api/blogs/${id}`)
      .then((d) => setForm({ ...EMPTY, ...d.blog }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCover(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      set("coverImage", url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function save() {
    setError("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await api("/api/blogs", { method: "POST", body: JSON.stringify(form) });
      } else {
        await api(`/api/blogs/${id}`, { method: "PUT", body: JSON.stringify(form) });
      }
      navigate("/blogs");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="page-sub">Loading...</p>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 className="page-title">{isNew ? "New blog post" : "Edit blog post"}</h1>
      <p className="page-sub">Content is saved as HTML and shown on the website.</p>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="form-row">
          <label className="field-label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Blog title"
          />
        </div>

        <div className="form-row">
          <label className="field-label">Slug (URL) — leave blank to auto-generate</label>
          <input
            className="input"
            value={form.slug || ""}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="my-blog-post"
          />
        </div>

        <div className="form-row">
          <label className="field-label">Short description</label>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="A one or two line summary shown on cards and search results."
          />
        </div>

        <div className="form-row">
          <label className="field-label">Cover image</label>
          {form.coverImage && (
            <img
              src={form.coverImage}
              alt="cover"
              style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, marginBottom: 8 }}
            />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <label className="btn ghost" style={{ cursor: "pointer" }}>
              {uploadingCover ? "Uploading..." : form.coverImage ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" hidden onChange={handleCover} />
            </label>
            {form.coverImage && (
              <button className="btn ghost" onClick={() => set("coverImage", "")}>
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="form-row">
          <label className="field-label">Content</label>
          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>SEO settings</h2>
        <div className="form-row">
          <label className="field-label">Meta title</label>
          <input
            className="input"
            value={form.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)}
            placeholder="Defaults to the post title"
          />
        </div>
        <div className="form-row">
          <label className="field-label">Meta description</label>
          <textarea
            className="input"
            value={form.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            placeholder="Defaults to the short description. ~155 characters recommended."
          />
        </div>
        <div className="form-row">
          <label className="field-label">Meta keywords (comma separated)</label>
          <input
            className="input"
            value={form.metaKeywords}
            onChange={(e) => set("metaKeywords", e.target.value)}
            placeholder="custom magnets, photo gifts, fridge magnets"
          />
        </div>
        <div className="form-row">
          <label className="field-label">Author</label>
          <input
            className="input"
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Published (visible on the website)
        </label>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save post"}
        </button>
        <button className="btn ghost" onClick={() => navigate("/blogs")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
