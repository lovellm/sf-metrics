import { PiMoon, PiSun } from "react-icons/pi";
import Toggle from "../Toggle";
import usePageState from "../../context/usePageState";

export default function ToggleDark() {
  const [{ isDark }, dispatch] = usePageState();

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
