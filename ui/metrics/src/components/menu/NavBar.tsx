import { useLocation } from "react-router";
import NavLink from "./NavLink";
import { navOptions } from "./navOptions";

export default function NavBar() {
  const location = useLocation();
  return (
    <nav className="shadow-base mb-2 hidden flex-row flex-wrap items-center justify-start bg-fuchsia-200 px-8 md:flex lg:gap-x-8 dark:bg-fuchsia-900">
      {navOptions.map((item) => {
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
