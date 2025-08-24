import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import AdminLayout from "../components/layout/AdminLayout";

// Public pages
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import FoundItemsPage from "../pages/FoundItemsPage";

// Admin pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminItems from "../pages/admin/Items";
import AdminReports from "../pages/admin/Reports";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="found-items" element={<FoundItemsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="items" element={<AdminItems />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
