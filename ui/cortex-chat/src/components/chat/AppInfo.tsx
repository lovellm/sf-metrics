import useAppState from "@/context/useAppState";

const DEFAULT_INFO =
  "Ask a question and AI will search through documentation to provide an answer.";

export default function AppInfo() {
  const [{ appConfig }] = useAppState();

  return (
    <div className="bg-primary-dark text-lightGray w-full px-4 py-1 pr-2 xl:px-10">
      {appConfig?.appInfo || DEFAULT_INFO}
    </div>
  );
}
