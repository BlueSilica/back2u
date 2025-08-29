import { useState } from "react";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaUser,
  FaClipboardList,
  FaCog,
  FaHome,
  FaComments,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

interface HeaderProps {
  currentView?: "home" | "dashboard" | "chat" | "profile";
  onNavigate?: (view: "home" | "dashboard" | "chat" | "profile") => void;
}

const Header = ({ currentView = "home", onNavigate }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNavClick = (view: "home" | "dashboard" | "chat" | "profile") => {
    if (onNavigate) {
      onNavigate(view);
    }
    setShowUserMenu(false);
    // update URL for simple routing
    if (view === "chat") window.history.pushState({}, "", "/chat");
    if (view === "profile") window.history.pushState({}, "", "/profile");
    if (view === "home") window.history.pushState({}, "", "/");
  };

  return (
    <>
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-gray-900 dark:text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center flex-wrap">
          <div
            className="logo cursor-pointer"
            onClick={() => handleNavClick("home")}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
              Back2U
            </h1>
            <p className="text-sm opacity-90 italic">
              Reuniting lost items with their owners
            </p>
          </div>

          <nav className="flex items-center gap-6 w-full md:w-auto justify-end md:justify-center">
            <ul className="hidden md:flex items-center gap-2">
              <li>
                <button
                  onClick={() => handleNavClick("home")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentView === "home"
                      ? "bg-white/25 text-gray-900 dark:text-white dark:bg-white/10 ring-1 ring-white/20"
                      : "text-gray-900 dark:text-white hover:bg-white/10"
                  }`}
                >
                  <FaHome className="w-4 h-4" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <a
                  href="#lost-items"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white hover:bg-white/10 transition-all"
                >
                  Lost Items
                </a>
              </li>
              <li>
                <a
                  href="#found-items"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white hover:bg-white/10 transition-all"
                >
                  Found Items
                </a>
              </li>
              <li>
                <a
                  href="#report"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white hover:bg-white/10 transition-all"
                >
                  Report Item
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick("chat")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    currentView === "chat"
                      ? "bg-white/25 text-gray-900 dark:text-white dark:bg-white/10 ring-1 ring-white/20"
                      : "text-gray-900 dark:text-white hover:bg-white/10"
                  }`}
                >
                  <FaComments className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              </li>
            </ul>

            <div className="ml-4">
              {user ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-3 bg-white text-primary-600 px-3 py-1.5 rounded-full font-medium shadow-sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <span className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-semibold text-sm">
                      {user.name ? (
                        user.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      ) : (
                        <FaUser />
                      )}
                    </span>
                    <span className="hidden sm:inline text-sm text-gray-900">
                      {user.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => handleNavClick("dashboard")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors ${
                          currentView === "dashboard"
                            ? "bg-blue-50 text-blue-600 shadow-sm"
                            : ""
                        }`}
                      >
                        <span className="text-sm">
                          <FaTachometerAlt />
                        </span>{" "}
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleNavClick("profile")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors ${
                          currentView === "profile"
                            ? "bg-blue-50 text-blue-600 shadow-sm"
                            : ""
                        }`}
                      >
                        <span className="text-sm">
                          <FaUser />
                        </span>{" "}
                        My Profile
                      </button>
                      <a
                        href="#my-items"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          <FaClipboardList />
                        </span>{" "}
                        My Items
                      </a>
                      <a
                        href="#settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          <FaCog />
                        </span>{" "}
                        Settings
                      </a>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          handleNavClick("home");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-sm">
                          <FaSignOutAlt />
                        </span>{" "}
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-primary-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 shadow-md"
                >
                  Login
                </button>
              )}
            </div>
          </nav>
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
