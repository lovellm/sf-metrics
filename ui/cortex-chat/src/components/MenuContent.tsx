import useAppState from "@/context/useAppState";
import configCache from "@/data/configCache";
import { MenuDivider, MenuItem, useBackToHome, usePageState } from "@spcs-apps/page-parts";
import { IoTrashOutline } from "react-icons/io5";
import { PiHouse, PiListBullets } from "react-icons/pi";

interface MenuContentProps {
  isAdmin?: boolean;
}

export default function MenuContent({ isAdmin }: MenuContentProps) {
  const backToHome = useBackToHome();
  const [{ dataCache }] = useAppState();
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
      <MenuItem
        icon={<IoTrashOutline />}
        onClick={() => {
          configCache
            .clearCache()
            .catch((e) => {
              console.error("error clearing default cache", e);
            })
            .finally(() => {
              dispatch({
                type: "setOverlay",
                payload: (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="text-xl font-bold">
                      Configuration and Data Cache has been Cleared
                    </div>
                    <div>Please refresh the page or you may have issues.</div>
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
        Clear Cached Data
      </MenuItem>
      {/* Clear History */}
      {dataCache && (
        <MenuItem
          icon={<IoTrashOutline />}
          onClick={() => {
            dataCache
              .clear()
              .catch((e) => {
                console.error("error clearing default cache", e);
              })
              .finally(() => {
                dispatch({
                  type: "setOverlay",
                  payload: (
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="text-xl font-bold">Chat History has been Cleared</div>
                      <div>
                        If you are currently viewing history, you will need to refresh the page.
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
          Clear Chat History
        </MenuItem>
      )}
      {/* Menu Bottom Justified Items */}
      <div className="flex grow flex-col flex-nowrap justify-end gap-y-2 pb-6">
        {isAdmin && (
          <MenuItem to="/" icon={<PiListBullets />}>
            List Configs
          </MenuItem>
        )}
        {/* Admin Page */}
        {/* {isAdmin && (
          <MenuItem to="/admin" icon={<PiGearBold />}>
            Maintain Config
          </MenuItem>
        )} */}
      </div>
    </>
  );
}
