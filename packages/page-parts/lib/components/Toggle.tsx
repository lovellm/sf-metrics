interface ToggleProps {
  checked?: boolean;
  onToggle?: (next: boolean) => void;
  dimInactive?: boolean;
}

export default function Toggle({ checked, onToggle, dimInactive }: ToggleProps) {
  return (
    <div className="relative inline-block cursor-pointer">
      <input
        type="checkbox"
        className="peer absolute h-0 w-0 opacity-0"
        checked={checked}
        onChange={() => {
          if (onToggle) {
            onToggle(!checked);
          }
        }}
      />
      <div className="ctrl-outline bg-accent-medium dark:bg-accent hover:bg-accent-light dark:hover:bg-accent-medium relative flex h-4 w-8 items-center rounded-full peer-focus:outline-2">
        <div
          className={
            "absolute left-0 inline-block h-4 w-4 rounded-full transition-transform" +
            (dimInactive && !checked
              ? " bg-neutral-300 dark:bg-neutral-600"
              : " bg-accent-dark dark:bg-accent-dark") +
            (checked ? " translate-x-4" : "")
          }
        />
      </div>
    </div>
  );
}
