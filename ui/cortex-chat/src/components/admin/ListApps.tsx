import { AppConfig } from "@/constants";
import { IoRefresh } from "react-icons/io5";

interface ConfigLinksProps {
  configs: AppConfig[];
  currentId?: string;
  setCurrentId: (next: string) => void;
  handleRefresh: () => void;
}

export default function ListApps({
  configs,
  handleRefresh,
  currentId,
  setCurrentId,
}: ConfigLinksProps) {
  return (
    <div>
      <div className="relative px-4 pt-1 pb-2">
        <b>Current Apps</b>
        <button
          type="button"
          className="hover:bg-accent absolute top-1 right-1 cursor-pointer rounded-full p-1 text-lg"
          onClick={handleRefresh}
        >
          <IoRefresh />
        </button>
      </div>
      <div className="pb-4">
        <ul>
          {Object.entries(configs).map(([index, data]) =>
            data.appId ? (
              <li key={index}>
                <button
                  type="button"
                  className={
                    "a-main w-full px-4 text-left " +
                    (data?.appId === currentId
                      ? "bg-accent-light font-bold dark:bg-neutral-800"
                      : "")
                  }
                  onClick={() => {
                    if (data?.appId === currentId) {
                      setCurrentId("");
                    } else {
                      setCurrentId(data?.appId || "");
                    }
                  }}
                >
                  {data.appTitle} ({data.appId})
                </button>
              </li>
            ) : undefined,
          )}
        </ul>
      </div>
    </div>
  );
}
