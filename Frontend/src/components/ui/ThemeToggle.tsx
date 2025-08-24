import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useTheme } from "../layout/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const ThemeToggle = ({
  className = "",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) => {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: FaSun },
    { value: "dark", label: "Dark", icon: FaMoon },
    { value: "system", label: "System", icon: FaDesktop },
  ] as const;

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getCurrentIcon = () => {
    if (theme === "system") {
      return effectiveTheme === "dark" ? FaMoon : FaSun;
    }
    return theme === "dark" ? FaMoon : FaSun;
  };

  const toggleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className={`relative ${className}`}>
      {/* Simple toggle button */}
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          bg-white/10 
          hover:bg-white/20 
          dark:bg-gray-800/50 
          dark:hover:bg-gray-700/50 
          backdrop-blur-sm 
          border border-white/20 
          dark:border-gray-600/30 
          transition-all 
          duration-300 
          flex 
          items-center 
          justify-center 
          text-white/90 
          hover:text-white 
          dark:text-gray-300 
          dark:hover:text-white
          hover:scale-105
          focus:outline-none
          focus:ring-2
          focus:ring-white/30
          dark:focus:ring-gray-400/30
        `}
        title={`Current theme: ${
          theme === "system" ? `System (${effectiveTheme})` : theme
        }`}
        aria-label="Toggle theme"
      >
        <CurrentIcon className={iconSizes[size]} />
      </button>

      {/* Label */}
      {showLabel && (
        <span className="ml-2 text-sm text-white/80 dark:text-gray-300 hidden lg:inline">
          {theme === "system" ? `System (${effectiveTheme})` : theme}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
