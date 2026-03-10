import { createContext } from "react";
import { AppConfig, appConfigId } from "../constants";
import { DataCache, getDefaultCacheOptions } from "@spcs-apps/data-utils";
import ChatController from "../data/ChatController";
import SearchController from "../data/SearchController";

export interface AppState {
  dataCache: DataCache;
  appConfig?: AppConfig;
  showSavedHistory?: boolean;
  chatController?: ChatController;
  searchController?: SearchController;
  showOptions?: boolean;
  optionValues?: Record<string, string | string[]>;
}
export const defaultAppState: AppState = {
  dataCache: new DataCache(),
  showOptions: true,
};

export type AppStateAction =
  | { type: "setAppConfig"; payload: AppConfig | undefined }
  | { type: "setShowSavedHistory"; payload: boolean | undefined }
  | { type: "setShowOptions"; payload: boolean }
  | { type: "setOptionValues"; payload: Record<string, string | string[]> | undefined };

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  const { type, payload } = action;
  switch (type) {
    case "setAppConfig": {
      const nextState = { ...state };
      nextState.appConfig = payload;

      if (payload?.appId) {
        // load the app cache if it has an appId
        // skip opening if already open
        if (payload.appId !== nextState.dataCache?.dbName) {
          if (state.dataCache) {
            state.dataCache.close();
          }
          nextState.dataCache = new DataCache(payload.appId, getDefaultCacheOptions());
        }

        // recreate the controllers
        nextState.chatController = new ChatController();
        nextState.searchController = new SearchController();

        appConfigId.appId = payload.appId;
      } else {
        // somehow no app id, set an empty data cache
        if (nextState.dataCache) {
          nextState.dataCache.close();
        }
        nextState.dataCache = new DataCache();
        // remove controllers
        nextState.chatController = undefined;
        nextState.searchController = undefined;
      }

      return nextState;
    }
    case "setShowSavedHistory":
      return { ...state, showSavedHistory: payload };
    case "setShowOptions": {
      return { ...state, showOptions: payload };
    }
    case "setOptionValues": {
      return { ...state, optionValues: payload };
    }
    default:
      return state;
  }
}

export type AppStateContextValue = [AppState, React.ActionDispatch<[action: AppStateAction]>];
const defaultContext: AppStateContextValue = [defaultAppState, () => undefined];
export const AppStateContext = createContext<AppStateContextValue>(defaultContext);
