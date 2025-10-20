import { Outlet } from "react-router";
import Menu from "./components/menu/Menu";
import Footer from "./components/page/Footer";
import Header from "./components/page/Header";
import NavBar from "./components/menu/NavBar";
import Overlay from "./components/page/Overlay";

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
