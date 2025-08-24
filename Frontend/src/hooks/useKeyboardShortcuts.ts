import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/layout/ThemeProvider";
import { KEYBOARD_SHORTCUTS, THEMES } from "../utils/constants";

export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();

  // Navigation shortcuts
  useHotkeys(
    KEYBOARD_SHORTCUTS.NAVIGATION.DASHBOARD,
    () => {
      navigate("/admin/dashboard");
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.NAVIGATION.USERS,
    () => {
      navigate("/admin/users");
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.NAVIGATION.ITEMS,
    () => {
      navigate("/admin/items");
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.NAVIGATION.REPORTS,
    () => {
      navigate("/admin/reports");
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.NAVIGATION.HOME,
    () => {
      navigate("/");
    },
    { preventDefault: true }
  );

  // Theme shortcuts
  useHotkeys(
    KEYBOARD_SHORTCUTS.GLOBAL.TOGGLE_THEME,
    () => {
      const currentIndex = THEMES.indexOf(theme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      setTheme(THEMES[nextIndex]);
    },
    { preventDefault: true }
  );

  // Search shortcut
  useHotkeys(KEYBOARD_SHORTCUTS.GLOBAL.SEARCH, (e) => {
    e.preventDefault();
    // Open search modal or focus search input
    const searchInput = document.getElementById("global-search-input");
    if (searchInput) {
      searchInput.focus();
    }
  });
};

export const useAdminKeyboardShortcuts = () => {
  // Admin-specific shortcuts
  useHotkeys(
    KEYBOARD_SHORTCUTS.ADMIN.NEW_ITEM,
    () => {
      // Trigger new item modal
      const event = new CustomEvent("admin:new-item");
      window.dispatchEvent(event);
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.ADMIN.FILTER,
    () => {
      // Focus search/filter input in data tables
      const filterInput = document.getElementById("data-table-search");
      if (filterInput) {
        filterInput.focus();
      }
    },
    { preventDefault: true }
  );

  useHotkeys(
    KEYBOARD_SHORTCUTS.ADMIN.REFRESH,
    () => {
      // Refresh current view
      window.location.reload();
    },
    { preventDefault: true }
  );
};
