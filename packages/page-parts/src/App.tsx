import { Outlet } from "react-router";
import { Footer, Header, Menu, Overlay, NavBar } from "../lib/main";
// import "../lib/index.css";

function App() {
  return (
    <>
      <Header />
      <NavBar />
      <main className="relative z-0">
        <Outlet />
      </main>
      <Menu />
      <Overlay />
      <Footer />
    </>
  );
}

export default App;
