import { useLocation } from "react-router";
import NavLink from "./NavLink";

export interface NavOption {
  to: string;
  content: string;
  icon?: React.ReactNode;
  role?: string;
  showOnBar?: boolean;
}

interface NavBarProps {
  options?: NavOption[];
}

export default function NavBar({ options }: NavBarProps) {
  const location = useLocation();
  return (
    <nav className="bg-accent-light shadow-base dark:bg-primary-dark mb-2 hidden flex-row flex-wrap items-center justify-start px-8 md:flex lg:gap-x-8">
      {options?.map((item) => {
        if (!item.showOnBar) {
          // item not intended to show on ths nav bar
          if (location.pathname && !location.pathname.startsWith(item.to)) {
            // but still show it if we are currently on it, otherwise weird spacing glitches occur on hover
            return undefined;
          }
        }
        const link = (
          <NavLink key={item.to} to={item.to}>
            {item.content}
          </NavLink>
        );
        return link;
      })}
    </nav>
  );
}
