import { Outlet } from "react-router";
import { useUser } from "@spcs-apps/data-utils";
import { Footer, Menu, Header, Overlay, NavBar } from "@spcs-apps/page-parts";
import MenuContent from "./components/menu/MenuContent";
import { navOptions } from "./components/menu/navOptions";
import { appVersionBuild } from "./constants";

function App() {
  const user = useUser();

  return (
    <>
      <Header appTitle="Snowflake Metrics" />
      <NavBar options={navOptions} />
      <main className="relative z-0">
        <Outlet />
      </main>
      <Menu userName={user?.user || "Loading"}>
        <MenuContent />
      </Menu>
      <Overlay />
      <Footer version={appVersionBuild} />
    </>
  );
}

export default App;
