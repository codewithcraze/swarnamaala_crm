import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api.js";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import PrintSheet from "./pages/PrintSheet.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import CampaignEditor from "./pages/CampaignEditor.jsx";
import Media from "./pages/Media.jsx";
import Referrals from "./pages/Referrals.jsx";
import Coupons from "./pages/Coupons.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogEditor from "./pages/BlogEditor.jsx";

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/orders/:id/print"
        element={
          <Protected>
            <PrintSheet />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignEditor />} />
        <Route path="/media" element={<Media />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
