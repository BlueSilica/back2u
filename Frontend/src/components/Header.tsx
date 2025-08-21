import { useState, useEffect, useRef } from "react";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaUser,
  FaClipboardList,
  FaCog,
  FaHome,
  FaComments,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

interface HeaderProps {
  currentView?: "home" | "dashboard" | "chat" | "found-items";
  onNavigate?: (view: "home" | "dashboard" | "chat" | "found-items") => void;
}

const Header = ({ currentView = "home", onNavigate }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (
    view: "home" | "dashboard" | "chat" | "found-items"
  ) => {
    if (onNavigate) {
      onNavigate(view);
    }
    setShowUserMenu(false);
    setShowMobileMenu(false);
    // update URL for simple routing
    if (view === "chat") window.history.pushState({}, "", "/chat");
    if (view === "found-items")
      window.history.pushState({}, "", "/found-items");
    if (view === "home") window.history.pushState({}, "", "/");
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return "";
  };

  // Generate avatar background color from user name
  const getAvatarColor = () => {
    if (!user?.name) return "from-purple-400 to-pink-400";
    const colors = [
      "from-blue-400 to-cyan-400",
      "from-purple-400 to-pink-400",
      "from-green-400 to-teal-400",
      "from-orange-400 to-red-400",
      "from-indigo-400 to-purple-400",
    ];
    const index = user.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <>
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 shadow-xl sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div
              className="logo cursor-pointer group transition-transform hover:scale-105"
              onClick={() => handleNavClick("home")}
            >
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Back2U
              </h1>
              <p className="text-xs sm:text-sm opacity-90 italic text-white/80">
                Reuniting lost items with their owners
              </p>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <ul className="flex items-center gap-1">
                <li>
                  <button
                    onClick={() => handleNavClick("home")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "home"
                        ? "bg-white/20 text-white backdrop-blur-sm shadow-lg ring-2 ring-white/30"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <FaHome className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <a
                    href="#lost-items"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Lost Items
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick("found-items")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "found-items"
                        ? "bg-white/20 text-white backdrop-blur-sm shadow-lg ring-2 ring-white/30"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Found Items
                  </button>
                </li>
                <li>
                  <a
                    href="#report"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Report Item
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick("chat")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "chat"
                        ? "bg-white/20 text-white backdrop-blur-sm shadow-lg ring-2 ring-white/30"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <FaComments className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                </li>
              </ul>

              {/* User Menu */}
              <div className="ml-6">
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      className="group relative flex items-center gap-3 p-1 rounded-full transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      aria-label="User menu"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      {/* Avatar Circle */}
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center font-semibold text-white shadow-lg ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300 group-hover:shadow-xl`}
                        >
                          {getUserInitials() || <FaUser className="w-5 h-5" />}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"></div>
                      </div>

                      {/* Username (hidden on small screens) */}
                      <span className="hidden lg:block text-sm font-medium text-white max-w-[150px] truncate">
                        {user.name}
                      </span>

                      {/* Dropdown arrow */}
                      <svg
                        className={`hidden lg:block w-4 h-4 text-white/70 transition-transform duration-200 ${
                          showUserMenu ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-fadeIn">
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center font-semibold text-white shadow-md`}
                            >
                              {getUserInitials() || (
                                <FaUser className="w-6 h-6" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email || "user@example.com"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-2">
                          <button
                            onClick={() => handleNavClick("dashboard")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all ${
                              currentView === "dashboard"
                                ? "bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-600 dark:text-primary-400"
                                : ""
                            }`}
                          >
                            <FaTachometerAlt className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Dashboard
                            </span>
                            {currentView === "dashboard" && (
                              <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </button>

                          <a
                            href="#profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                          >
                            <FaUser className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              My Profile
                            </span>
                          </a>

                          <a
                            href="#my-items"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                          >
                            <FaClipboardList className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              My Items
                            </span>
                            <span className="ml-auto bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full">
                              3
                            </span>
                          </a>

                          <a
                            href="#settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                          >
                            <FaCog className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Settings
                            </span>
                          </a>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200/50 dark:border-gray-700/50 py-2">
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                              handleNavClick("home");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <FaSignOutAlt className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-white/90 backdrop-blur-sm text-primary-600 px-5 py-2.5 rounded-full font-semibold hover:bg-white hover:shadow-xl transition-all duration-300 shadow-lg ring-2 ring-white/30 hover:ring-white/50"
                  >
                    Login
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-3">
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="group relative p-1 rounded-full transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="User menu"
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center font-semibold text-white shadow-lg ring-2 ring-white/30 group-hover:ring-white/50 transition-all`}
                    >
                      {getUserInitials() || <FaUser className="w-4 h-4" />}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white"></div>
                  </button>

                  {/* Mobile dropdown - same as desktop but adjusted position */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-fadeIn">
                      {/* Same dropdown content as desktop */}
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center font-semibold text-white shadow-md`}
                          >
                            {getUserInitials() || (
                              <FaUser className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email || "user@example.com"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => handleNavClick("dashboard")}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all ${
                            currentView === "dashboard"
                              ? "bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-600 dark:text-primary-400"
                              : ""
                          }`}
                        >
                          <FaTachometerAlt className="w-4 h-4" />
                          <span className="text-sm font-medium">Dashboard</span>
                        </button>

                        <a
                          href="#profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                        >
                          <FaUser className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            My Profile
                          </span>
                        </a>

                        <a
                          href="#my-items"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                        >
                          <FaClipboardList className="w-4 h-4" />
                          <span className="text-sm font-medium">My Items</span>
                          <span className="ml-auto bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full">
                            3
                          </span>
                        </a>

                        <a
                          href="#settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all"
                        >
                          <FaCog className="w-4 h-4" />
                          <span className="text-sm font-medium">Settings</span>
                        </a>
                      </div>

                      <div className="border-t border-gray-200/50 dark:border-gray-700/50 py-2">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            handleNavClick("home");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <FaSignOutAlt className="w-4 h-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white/90 backdrop-blur-sm text-primary-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-white hover:shadow-xl transition-all duration-300 shadow-lg"
                >
                  Login
                </button>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-all"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? (
                  <FaTimes className="w-5 h-5" />
                ) : (
                  <FaBars className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <nav className="md:hidden mt-4 pb-2 animate-fadeIn">
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    onClick={() => handleNavClick("home")}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "home"
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <FaHome className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <a
                    href="#lost-items"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all"
                  >
                    Lost Items
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick("found-items")}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "found-items"
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    Found Items
                  </button>
                </li>
                <li>
                  <a
                    href="#report"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all"
                  >
                    Report Item
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick("chat")}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === "chat"
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <FaComments className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default Header;
