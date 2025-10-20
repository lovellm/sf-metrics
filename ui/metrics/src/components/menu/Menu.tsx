import { useEffect } from "react";
import { PiXBold } from "react-icons/pi";
import { IoTrashOutline } from "react-icons/io5";
import useAppState from "../../context/useAppState";
import ToggleDark from "./ToggleDark";
import MenuItem from "./MenuItem";
import { clearLocalStorage } from "../../constants";
import MenuDivider from "./MenuDivider";
import { navOptions } from "./navOptions";
import { defaultCache } from "@/data/dataCache";
import useUser from "@/hooks/useUser";
import CreditCost from "./CreditCost";

export default function Menu() {
  const [{ isMenuOpen }, dispatch] = useAppState();
  const user = useUser();

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
      className="animate-fade-in fixed top-0 right-0 bottom-0 left-0 z-10 bg-neutral-900/70"
      onMouseDown={() => {
        dispatch({ type: "setIsMenuOpen", payload: false });
      }}
    >
      <div
        className="animate-slide-left border-main absolute top-0 right-0 flex h-dvh w-full flex-col gap-y-2 overflow-y-auto border-x border-l bg-neutral-50 pb-4 text-zinc-800 md:w-80 dark:bg-neutral-900 dark:text-zinc-200"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mt-1 flex items-center justify-between">
          <div className="pt-1 pl-2 text-xl">
            <div>{user?.user || "Loading..."}</div>
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
        {/* Add Nav Bar Items to Menu */}
        {navOptions.map((nav) => {
          const link = (
            <MenuItem key={nav.to} to={nav.to} icon={nav.icon}>
              {nav.content}
            </MenuItem>
          );
          return link;
        })}
        <MenuDivider />
        <MenuItem text key="change_credits">
          <CreditCost />
        </MenuItem>
        <MenuDivider key="divider" />
        <MenuItem
          icon={<IoTrashOutline />}
          onClick={() => {
            defaultCache
              .clear()
              .catch((e) => {
                console.error("error clearing default cache", e);
              })
              .finally(() => {
                clearLocalStorage();
                dispatch({
                  type: "setOverlay",
                  payload: (
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="text-xl font-bold">Data Cache has been Cleared</div>
                      <div>
                        Some components may continue to show cached data until you refresh the page.
                      </div>
                      <button
                        type="button"
                        className="btn-main m-4 cursor-pointer rounded p-2 text-lg"
                        onClick={() => {
                          window.location.reload();
                        }}
                      >
                        Refresh Page
                      </button>
                    </div>
                  ),
                });
              });
          }}
        >
          Clear Local Storage
        </MenuItem>
      </div>
    </div>
  );
}
