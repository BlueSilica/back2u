import { cn } from "../../utils/cn";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Kbd = ({ children, className, ...props }: KbdProps) => {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:bg-gray-800 dark:text-gray-400",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
};

export { Kbd };
