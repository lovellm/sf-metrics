import { ReactNode } from "react";
import { NavLink as RouterNavLink } from "react-router";
import usePageState from "../../context/usePageState";

interface MenuItemProps {
  children?: React.ReactNode;
  onClick?: () => void;
  /** if true, render as a div instead of a button */
  text?: boolean;
  /** icon to use for buttons, assumed to be from react-icons*/
  icon?: ReactNode;
  to?: string;
}

export default function MenuItem({ children, onClick, text, icon, to }: MenuItemProps) {
  const [, dispatch] = usePageState();
  const className = "px-2 text-left";
  if (text) {
    return <div className={className}>{children}</div>;
  }

  const hoverClass = " cursor-pointer hover:bg-accent-link hover:text-accent-light";

  if (to) {
    return (
      <button type="button" onClick={() => dispatch({ type: "setIsMenuOpen", payload: false })}>
        <RouterNavLink
          to={to}
          className={({ isActive }) =>
            `${className} ${hoverClass} flex items-center ${isActive ? "bg-accent-light dark:bg-accent font-bold" : ""}`
          }
        >
          {icon && <div className="pr-2">{icon}</div>}
          {children}
        </RouterNavLink>
      </button>
    );
  }

  if (typeof onClick === "function") {
    return (
      <button
        type="button"
        className={className + hoverClass + (icon ? " flex items-center" : "")}
        onClick={onClick}
      >
        {icon && <div className="pr-2">{icon}</div>}
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}
