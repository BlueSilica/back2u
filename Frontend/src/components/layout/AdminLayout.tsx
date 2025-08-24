import { Outlet } from "react-router-dom";
import {
  useGlobalKeyboardShortcuts,
  useAdminKeyboardShortcuts,
} from "../../hooks/useKeyboardShortcuts";
import AdminSidebar from "../admin/AdminSidebar";
import AdminNavbar from "../admin/AdminNavbar";
import KeyboardShortcuts from "./KeyboardShortcuts";

const AdminLayout = () => {
  useGlobalKeyboardShortcuts();
  useAdminKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <KeyboardShortcuts />
    </div>
  );
};

export default AdminLayout;
