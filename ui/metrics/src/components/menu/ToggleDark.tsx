import { PiMoon, PiSun } from "react-icons/pi";
import useAppState from "../../context/useAppState";
import Toggle from "../basic/Toggle";

export default function ToggleDark() {
  const [{ isDark }, dispatch] = useAppState();

  return (
    <label className="flex items-center gap-x-2">
      <PiSun />
      <Toggle
        checked={isDark}
        onToggle={(next) => dispatch({ type: "setIsDark", payload: next })}
      />
      <PiMoon />
    </label>
  );
}
