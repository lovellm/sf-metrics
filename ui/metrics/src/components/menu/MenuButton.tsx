import { PiListBold } from "react-icons/pi";
import useAppState from "../../context/useAppState";

export default function MenuButton() {
  const [{ isMenuOpen }, dispatch] = useAppState();
  return (
    <button
      type="button"
      title={(isMenuOpen ? "Close" : "Open") + " Menu"}
      className={
        "btn-nav h-8 w-8 rounded text-2xl transition-transform " + (isMenuOpen ? "rotate-90" : "")
      }
      onClick={() => {
        dispatch({ type: "setIsMenuOpen", payload: !isMenuOpen });
      }}
    >
      <PiListBold />
    </button>
  );
}
