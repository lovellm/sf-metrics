import logoPng from "../../assets/logos/logo.png";
import useBackToHome from "../../hooks/useBackToHome";

interface LogoProps {
  appTitle?: string;
}

function Logo({ appTitle = "" }: LogoProps) {
  const backToHome = useBackToHome();

  return (
    <button
      type="button"
      onClick={backToHome}
      aria-label="Return to Home"
      className="flex cursor-pointer flex-row items-center gap-x-4"
    >
      <img src={logoPng} alt="Logo" className="h-16 py-3" />
      <div className="-mt-1 ml-4 text-2xl">{appTitle}</div>
    </button>
  );
}

export default Logo;
