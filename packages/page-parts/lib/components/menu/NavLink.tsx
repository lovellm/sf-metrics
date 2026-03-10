import { NavLink as RouterNavLink } from "react-router";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  /** base className to always apply, instead of default */
  className?: string;
  /** additional className to apply when active, instead of default */
  activeClass?: string;
}

const defaultClassName =
  "hover:text-accent-link dark:hover:text-accent-light hover:border-accent-link hover:border-b-4 font-bold py-2 px-4 ";
const defaultActiveClass = "border-text border-b-4";

export default function NavLink({ to, children, className, activeClass }: NavLinkProps) {
  const classNameBase = className === undefined ? defaultClassName : className;
  const classNameActive = activeClass === undefined ? defaultActiveClass : activeClass;
  return (
    <RouterNavLink
      className={({ isActive }) =>
        (classNameBase || "") + " " + (isActive ? classNameActive || "" : "")
      }
      to={to}
    >
      {children}
    </RouterNavLink>
  );
}
