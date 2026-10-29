import { Box } from "@mui/material";
import { PageHeader } from "../components/ui.jsx";
import MediaLibrary from "../components/MediaLibrary.jsx";

export default function Media() {
  return (
    <Box>
      <PageHeader
        title="Email images"
        subtitle="Upload images and copy their public URLs to use in email campaigns."
      />
      <MediaLibrary />
    </Box>
  );
}
