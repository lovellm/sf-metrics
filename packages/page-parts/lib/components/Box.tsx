interface BoxProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export default function Box({ className, children, style }: BoxProps) {
  return (
    <div
      className={
        "border-main shadow-base rounded-lg border bg-white dark:bg-zinc-900 " + (className || "")
      }
      style={style}
    >
      {children}
    </div>
  );
}
