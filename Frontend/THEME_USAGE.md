# Theme Toggle Documentation

## Overview

The theme system in this application supports three modes:

- **Light**: Force light theme
- **Dark**: Force dark theme
- **System**: Automatically follow the user's system preference

## Components Available

### 1. ThemeToggle

A simple circular button that cycles through themes.

```tsx
import ThemeToggle from "./components/ui/ThemeToggle";

// Basic usage
<ThemeToggle />

// With custom size and label
<ThemeToggle size="lg" showLabel={true} className="ml-4" />
```

**Props:**

- `size`: "sm" | "md" | "lg" (default: "md")
- `showLabel`: boolean (default: false) - Shows current theme as text
- `className`: string - Additional CSS classes

### 2. ThemeSelect

A dropdown menu with explicit theme options.

```tsx
import ThemeSelect from "./components/ui/ThemeSelect";

<ThemeSelect className="ml-4" />;
```

**Props:**

- `className`: string - Additional CSS classes

## Where to Use

### Main Header (Public Layout)

The theme toggle is already added to:

- Desktop navigation (medium size)
- Mobile navigation (small size)

### Admin Layout

The theme toggle is already added to:

- Admin navbar (small size)

### Custom Locations

You can add the theme toggle anywhere in your app:

```tsx
// In a settings page
<div className="flex items-center justify-between">
  <span>Theme Preference</span>
  <ThemeSelect />
</div>

// In a sidebar
<ThemeToggle size="sm" showLabel={true} />

// In a floating action button
<ThemeToggle size="lg" className="fixed bottom-4 right-4" />
```

## How It Works

1. **Theme Detection**: The system automatically detects and applies the user's system theme preference when set to "system" mode.

2. **Persistence**: Theme choice is saved to localStorage and persists across browser sessions.

3. **Dynamic Updates**: When system theme changes (e.g., sunset on macOS), the app automatically updates if in "system" mode.

4. **CSS Integration**: Uses Tailwind CSS dark mode classes with the `dark:` prefix.

## Usage Tips

- Use `ThemeToggle` for minimal UI impact (just an icon)
- Use `ThemeSelect` when you want to be more explicit about theme options
- The theme automatically applies to all components using Tailwind's dark mode classes
- System theme is recommended as default for best user experience

## Current Implementation

The theme toggle has been added to:

- ✅ Main Header (desktop & mobile)
- ✅ Admin Navbar
- ✅ Available as reusable components

You can now change themes by clicking the sun/moon icon in the header!
