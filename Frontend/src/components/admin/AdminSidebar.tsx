import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Flag,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      shortcut: "Alt+D",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      shortcut: "Alt+U",
    },
    {
      name: "Items",
      href: "/admin/items",
      icon: Package,
      shortcut: "Alt+I",
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: Flag,
      shortcut: "Alt+R",
    },
  ];

  return (
    <div
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Admin Portal
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`
            }
            title={isCollapsed ? `${item.name} (${item.shortcut})` : ""}
          >
            <item.icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && <span className="flex-1">{item.name}</span>}
            {!isCollapsed && (
              <span className="text-xs opacity-60 group-hover:opacity-100">
                {item.shortcut.replace("alt+", "Alt+")}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && user && (
          <div className="px-3 py-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {user.name}
            </div>
            <div className="text-xs">{user.email}</div>
          </div>
        )}
        <button
          onClick={logout}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 rounded-md transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
