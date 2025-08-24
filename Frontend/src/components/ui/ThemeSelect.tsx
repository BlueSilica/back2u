import { useState, useRef, useEffect } from "react";
import { FaSun, FaMoon, FaDesktop, FaChevronDown } from "react-icons/fa";
import { useTheme } from "../layout/ThemeProvider";

interface ThemeSelectProps {
  className?: string;
}

const ThemeSelect = ({ className = "" }: ThemeSelectProps) => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes = [
    { value: "light", label: "Light", icon: FaSun },
    { value: "dark", label: "Dark", icon: FaMoon },
    { value: "system", label: "System", icon: FaDesktop },
  ] as const;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentTheme = () => {
    return themes.find((t) => t.value === theme) || themes[0];
  };

  const currentTheme = getCurrentTheme();
  const CurrentIcon = currentTheme.icon;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-lg transition-all duration-300 text-white/90 hover:text-white dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-gray-400/30"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {theme === "system" ? `System (${effectiveTheme})` : theme}
        </span>
        <FaChevronDown
          className={`w-3 h-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-fadeIn">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;

            return (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 ${
                  isSelected
                    ? "bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{themeOption.label}</span>
                {themeOption.value === "system" && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({effectiveTheme})
                  </span>
                )}
                {isSelected && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelect;
