import { AppConfig } from "@/constants";
import EditAppInfo from "./EditAppInfo";
import EditOptions from "./EditOptions";

interface EditAppProps {
  config?: AppConfig;
  /** when app is added/removed, calls this to set it as current */
  setCurrentApp: (next: string) => void;
  /** when app is added/removed, calls this to refresh list */
  handleRefresh: () => void;
}

export default function EditApp({ config, setCurrentApp, handleRefresh }: EditAppProps) {
  return (
    <div>
      <EditAppInfo config={config} handleRefresh={handleRefresh} setCurrentApp={setCurrentApp} />
      {config?.hasOptions && <EditOptions appId={config?.appId} />}
    </div>
  );
}
