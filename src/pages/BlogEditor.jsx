import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  FormControlLabel,
  Checkbox,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { api, uploadFile } from "../api.js";
import { PageHeader } from "../components/ui.jsx";
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

  if (loading) {
    return (
      <Box sx={{ maxWidth: 880 }}>
        <Skeleton width={240} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={420} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 880 }}>
      <PageHeader
        title={isNew ? "New blog post" : "Edit blog post"}
        subtitle="Content is saved as HTML and shown on the website."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Blog title"
            />
            <TextField
              label="Slug (URL) — leave blank to auto-generate"
              fullWidth
              size="small"
              value={form.slug || ""}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="my-blog-post"
            />
            <TextField
              label="Short description"
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A one or two line summary shown on cards and search results."
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Cover image
              </Typography>
              {form.coverImage && (
                <Box
                  component="img"
                  src={form.coverImage}
                  alt="cover"
                  sx={{
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              )}
              <Stack direction="row" spacing={1}>
                <Button
                  component="label"
                  variant="outlined"
                  color="inherit"
                  disabled={uploadingCover}
                  startIcon={uploadingCover ? <CircularProgress size={16} /> : null}
                  sx={{ borderColor: "divider", color: "text.secondary" }}
                >
                  {uploadingCover ? "Uploading…" : form.coverImage ? "Change image" : "Upload image"}
                  <input type="file" accept="image/*" hidden onChange={handleCover} />
                </Button>
                {form.coverImage && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => set("coverImage", "")}
                    sx={{ borderColor: "divider", color: "text.secondary" }}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Content
              </Typography>
              <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            SEO settings
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Meta title"
              fullWidth
              size="small"
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder="Defaults to the post title"
            />
            <TextField
              label="Meta description"
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              placeholder="Defaults to the short description. ~155 characters recommended."
            />
            <TextField
              label="Meta keywords (comma separated)"
              fullWidth
              size="small"
              value={form.metaKeywords}
              onChange={(e) => set("metaKeywords", e.target.value)}
              placeholder="custom magnets, photo gifts, fridge magnets"
            />
            <TextField
              label="Author"
              fullWidth
              size="small"
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.published}
                  onChange={(e) => set("published", e.target.checked)}
                />
              }
              label="Published (visible on the website)"
            />
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? "Saving…" : "Save post"}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/blogs")}
          sx={{ borderColor: "divider", color: "text.secondary" }}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
