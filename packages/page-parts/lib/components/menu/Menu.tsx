import { useEffect } from "react";
import { PiXBold } from "react-icons/pi";
import MenuItem from "./MenuItem";
import MenuDivider from "./MenuDivider";
import usePageState from "../../context/usePageState";
import ToggleDark from "./ToggleDark";

interface MenuProps {
  userName?: string;
  children?: React.ReactNode;
}

export default function Menu({ userName, children }: MenuProps) {
  const [{ isMenuOpen }, dispatch] = usePageState();

  // close menu on escape key press
  useEffect(() => {
    const closeMenu = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "setIsMenuOpen", payload: false });
      }
    };
    if (isMenuOpen) {
      window.addEventListener("keyup", closeMenu);
    }
    return () => {
      window.removeEventListener("keyup", closeMenu);
    };
  }, [isMenuOpen, dispatch]);

  // return nothing if not open
  if (!isMenuOpen) {
    return undefined;
  }

  return (
    <div
      className="animate-fade-in bg-primary-dark/70 fixed top-0 right-0 bottom-0 left-0 z-10"
      onMouseDown={() => {
        dispatch({ type: "setIsMenuOpen", payload: false });
      }}
    >
      <div
        className="bg-main animate-slide-left border-main absolute top-0 right-0 flex h-dvh w-full flex-col gap-y-2 overflow-y-auto border-x border-l pb-4 md:w-80"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mt-1 flex items-center justify-between">
          <div className="pt-1 pl-2 text-xl">
            <div>{userName || "User"}</div>
          </div>
          <button
            type="button"
            className="btn-nav mt-1 mr-6 rounded text-2xl"
            title="Close Menu"
            onClick={() => dispatch({ type: "setIsMenuOpen", payload: false })}
          >
            <PiXBold />
          </button>
        </div>
        <MenuDivider />
        <MenuItem>
          <ToggleDark />
        </MenuItem>
        <MenuDivider />
        {children}
      </div>
    </div>
  );
}
