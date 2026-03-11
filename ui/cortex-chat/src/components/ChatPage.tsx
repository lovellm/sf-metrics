import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAppState from "@/context/useAppState";
import AppInfo from "./chat/AppInfo";
import SavedHistoryList from "./chat/SavedHistoryList";
import useConfigs from "@/hooks/useConfigs";
import Chat from "./chat/Chat";
import ConfigLinks from "./chat/ConfigLinks";

export default function ChatPage() {
  const { configId } = useParams();
  const [{ appConfig, chatController, showSavedHistory, searchController }, dispatch] =
    useAppState();
  const [partialText, setPartialText] = useState<string>("");
  const { configs } = useConfigs();

  // set chatController callbacks when chatController changes
  useEffect(() => {
    if (chatController) {
      chatController.onMessageUpdated(setPartialText);
      chatController.onComplete(() => {
        setPartialText("");
      });
    }
  }, [chatController]);

  // load the appConfig when the configId changes
  useEffect(() => {
    if (configId && configId !== appConfig?.appId) {
      const config = configs.find((c) => c.appId?.toLowerCase() === configId.toLowerCase());
      dispatch({ type: "setAppConfig", payload: config });
    } else if (!configId && appConfig?.appId) {
      dispatch({ type: "setAppConfig", payload: undefined });
    }
  }, [dispatch, configId, appConfig?.appId, configs]);

  // update the controllers when the app config changes
  useEffect(() => {
    // search config
    if (appConfig && searchController) {
      searchController.db = appConfig.cortexSearchService?.db || "";
      searchController.schema = appConfig.cortexSearchService?.schema || "";
      searchController.service = appConfig.cortexSearchService?.service || "";
      const searchColumns: string[] = [];
      if (appConfig.cortexSearchDocuments?.nameField) {
        searchColumns.push(appConfig.cortexSearchDocuments.nameField);
      }
      if (appConfig.cortexSearchDocuments?.urlField) {
        searchColumns.push(appConfig.cortexSearchDocuments.urlField);
      }
      if (appConfig.cortexSearchDocuments?.contentField) {
        searchColumns.push(appConfig.cortexSearchDocuments.contentField);
      }
      searchController.columns = searchColumns;
      if (appConfig.cortexSearchService?.limit) {
        searchController.limit = appConfig.cortexSearchService?.limit;
      }
      searchController.asApi = appConfig.cortexSearchService?.asApi || false;
    }
    // chat config
    if (appConfig && chatController) {
      chatController.model = appConfig.model;
      chatController.asApi = appConfig.chatAsApi;
    }
  }, [appConfig, chatController, searchController]);

  // No App Config
  if (!appConfig) {
    return <ConfigLinks />;
  }

  // Have App Config, normal output
  return (
    <div className="grid grid-cols-1 items-center">
      <AppInfo />
      {showSavedHistory ? (
        <SavedHistoryList searchController={searchController} chatController={chatController} />
      ) : (
        <Chat
          chatController={chatController}
          searchController={searchController}
          partialText={partialText}
        />
      )}
    </div>
  );
}
