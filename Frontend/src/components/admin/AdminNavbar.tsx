import { useState, useRef, useEffect } from "react";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import ThemeToggle from "../ui/ThemeToggle";

const AdminNavbar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when Ctrl+K is pressed
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white/95 backdrop-blur dark:bg-gray-800/95 dark:border-gray-700">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              id="global-search-input"
              type="text"
              placeholder="Search users, items, reports... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 ${
                isSearchFocused ? "bg-white shadow-sm dark:bg-gray-600" : ""
              }`}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-gray-700 dark:border-gray-600">
                <div className="p-2 text-sm text-gray-600 dark:text-gray-300">
                  Press Enter to search for "{searchQuery}"
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {user?.role}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
