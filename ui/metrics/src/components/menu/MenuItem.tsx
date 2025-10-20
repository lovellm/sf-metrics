import { ReactNode } from "react";
import { NavLink as RouterNavLink } from "react-router";
import useAppState from "@/context/useAppState";

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
  const [, dispatch] = useAppState();
  const className = "px-2 text-left";
  if (text) {
    return <div className={className}>{children}</div>;
  }

  const hoverClass = " cursor-pointer hover:bg-fuchsia-600 hover:text-neutral-50";

  if (to) {
    const activeClass = "bg-purple-400 dark:bg-purple-700 font-bold";
    return (
      <button type="button" onClick={() => dispatch({ type: "setIsMenuOpen", payload: false })}>
        <RouterNavLink
          to={to}
          className={({ isActive }) =>
            `${className} ${hoverClass} flex items-center ${isActive ? activeClass : ""}`
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
