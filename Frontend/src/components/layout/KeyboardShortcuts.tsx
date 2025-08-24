import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { X, Keyboard } from "lucide-react";
import { Kbd } from "../ui/kbd";
import { Button } from "../ui/button";
import { KEYBOARD_SHORTCUTS } from "../../utils/constants";

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(
    KEYBOARD_SHORTCUTS.GLOBAL.HELP,
    () => {
      setIsOpen(!isOpen);
    },
    { preventDefault: true }
  );

  const shortcuts = [
    {
      category: "Navigation",
      items: [
        { key: "Alt + D", description: "Go to Dashboard" },
        { key: "Alt + U", description: "Go to Users" },
        { key: "Alt + I", description: "Go to Items" },
        { key: "Alt + R", description: "Go to Reports" },
        { key: "Alt + H", description: "Go to Home" },
      ],
    },
    {
      category: "Global",
      items: [
        { key: "Ctrl + Shift + T", description: "Toggle Theme" },
        { key: "Ctrl + K", description: "Global Search" },
        { key: "Ctrl + /", description: "Show Shortcuts" },
      ],
    },
    {
      category: "Admin Actions",
      items: [
        { key: "Ctrl + N", description: "New Item" },
        { key: "Ctrl + F", description: "Filter Table" },
        { key: "Ctrl + R", description: "Refresh Data" },
      ],
    },
  ];

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 shadow-lg"
        title="Keyboard shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {shortcuts.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                {section.category}
              </h4>
              <div className="space-y-2">
                {section.items.map((shortcut, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {shortcut.description}
                    </span>
                    <Kbd>{shortcut.key}</Kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Press <Kbd>Ctrl + /</Kbd> again to close this dialog
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
