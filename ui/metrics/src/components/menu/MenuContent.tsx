import { PiHouse } from "react-icons/pi";
import { IoTrashOutline } from "react-icons/io5";
import { MenuDivider, MenuItem, useBackToHome, usePageState } from "@spcs-apps/page-parts";
import { defaultCache } from "@/data/dataCache";
import { clearLocalStorage } from "@/constants";
import { navOptions } from "./navOptions";
import CreditCost from "./CreditCost";

export default function MenuContent() {
  const backToHome = useBackToHome();
  const [, dispatch] = usePageState();

  return (
    <>
      {/* Home */}
      <MenuItem
        icon={<PiHouse />}
        onClick={() => {
          backToHome();
        }}
      >
        Home
      </MenuItem>
      <MenuDivider />
      {/* Clear Data */}

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
    </>
  );
}
