// Navigation shortcuts
export const KEYBOARD_SHORTCUTS = {
  NAVIGATION: {
    DASHBOARD: "alt+d",
    USERS: "alt+u",
    ITEMS: "alt+i",
    REPORTS: "alt+r",
    HOME: "alt+h",
  },
  GLOBAL: {
    TOGGLE_THEME: "ctrl+shift+t",
    SEARCH: "ctrl+k",
    HELP: "ctrl+/",
  },
  ADMIN: {
    NEW_ITEM: "ctrl+n",
    FILTER: "ctrl+f",
    REFRESH: "ctrl+r",
  },
} as const;

// Theme constants
export const THEMES = ["light", "dark", "system"] as const;

// Admin role constant
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;
