import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import { setToken } from "../api.js";
import Logo, { LogoMark } from "./Logo.jsx";

const DRAWER_WIDTH = 248;

const LINKS = [
  { to: "/", label: "Dashboard", icon: <DashboardOutlinedIcon />, end: true },
  { to: "/users", label: "Users", icon: <PeopleOutlinedIcon /> },
  { to: "/orders", label: "Orders", icon: <Inventory2OutlinedIcon /> },
  { to: "/referrals", label: "Referrals", icon: <CardGiftcardOutlinedIcon /> },
  { to: "/coupons", label: "Coupons", icon: <LocalOfferOutlinedIcon /> },
  { to: "/campaigns", label: "Campaigns", icon: <CampaignOutlinedIcon /> },
  { to: "/media", label: "Email images", icon: <PhotoLibraryOutlinedIcon /> },
  { to: "/blogs", label: "Blog", icon: <ArticleOutlinedIcon /> },
];

function pageTitle(pathname) {
  if (pathname === "/") return "Dashboard";
  const seg = pathname.split("/")[1] || "";
  if (seg === "media") return "Email images";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    setToken(null);
    navigate("/login");
  }

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5, bgcolor: "black" }}>
        <img src='/logo.png' width="100%" height="70px" />
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}>
        {LINKS.map((l) => (
          <ListItemButton
            key={l.to}
            component={NavLink}
            to={l.to}
            end={l.end}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "text.secondary",
              "& .MuiListItemIcon-root": { color: "text.secondary", minWidth: 38 },
              "&.active": {
                bgcolor: "action.selected",
                color: "text.primary",
                fontWeight: 600,
                "& .MuiListItemIcon-root": { color: "secondary.main" },
                "& .MuiListItemText-primary": { fontWeight: 600 },
              },
            }}
          >
            <ListItemIcon>{l.icon}</ListItemIcon>
            <ListItemText primary={l.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<LogoutOutlinedIcon />}
          onClick={logout}
          sx={{ justifyContent: "flex-start", color: "text.secondary", borderColor: "divider" }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Mobile top app bar */}
      {!isDesktop && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <LogoMark size={26} />
            <Typography sx={{ fontWeight: 700, ml: 1.5 }}>
              {pageTitle(location.pathname)}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                bgcolor: "background.paper",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: { xs: 2, sm: 3 },
          pt: { xs: 9, md: 3 }, // offset for mobile app bar
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
