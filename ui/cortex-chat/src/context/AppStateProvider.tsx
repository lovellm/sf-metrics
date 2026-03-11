import { useReducer, useMemo } from "react";
import {
  AppStateContextValue,
  AppStateContext,
  appStateReducer,
  defaultAppState,
} from "./AppState";

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, defaultAppState);
  const context = useMemo<AppStateContextValue>(() => [state, dispatch], [state]);

  return <AppStateContext value={context}>{children}</AppStateContext>;
};
