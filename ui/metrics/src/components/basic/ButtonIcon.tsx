interface ButtonIconProps {
  children?: React.ReactNode;
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
  size?: "small";
}

/** a button intended to display an icon as its content */
export default function ButtonIcon({ children, title, onClick, className, size }: ButtonIconProps) {
  let textSize = "text-2xl w-8 h-8";
  if (size === "small") {
    textSize = "text-base w-6 h-6";
  }
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`ctrl-outline btn-main cursor-pointer rounded-xl p-1 ${textSize} flex items-center justify-center focus:outline-2 active:outline-2 ${className || ""}`}
    >
      {children}
    </button>
  );
}
