import { Footer, Header, Menu, Overlay } from "@spcs-apps/page-parts";
import { Outlet } from "react-router";
import { appVersionBuild } from "./constants";
import MenuContent from "./components/MenuContent";
import { useUser } from "@spcs-apps/data-utils";
import useAppState from "./context/useAppState";
import { useEffect } from "react";

function App() {
  const user = useUser("ADMIN_ROLE_HERE");
  const [{ appConfig }] = useAppState();

  useEffect(() => {
    if (appConfig?.appTitle) {
      document.title = appConfig.appTitle;
    }
  }, [appConfig?.appTitle]);

  return (
    <>
      <Header appTitle={appConfig?.appTitle || "Cortex Chat"} />
      <main className="relative z-0">
        <Outlet />
      </main>
      <Menu userName={user?.user || "Loading..."}>
        <MenuContent isAdmin={user?.inRole} />
      </Menu>
      <Overlay />
      <Footer version={appVersionBuild} />
    </>
  );
}

export default App;
