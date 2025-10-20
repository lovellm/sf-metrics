import useBackToHome from "@/hooks/useBackToHome";

function Logo() {
  const backToHome = useBackToHome();

  return (
    <button
      type="button"
      onClick={backToHome}
      aria-label="Return to Home"
      className="flex cursor-pointer flex-row items-center gap-x-4"
    >
      <div className="flex h-16 items-center">Logo Goes Here</div>
      <div className="-mt-1 ml-4 text-2xl">Snowflake Metrics</div>
    </button>
  );
}

export default Logo;
