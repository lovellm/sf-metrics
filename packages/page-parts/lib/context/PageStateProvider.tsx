import { useReducer, useMemo } from "react";
import {
  PageStateContextValue,
  PageStateContext,
  appStateReducer,
  defaultAppState,
} from "./PageState";

export const PageStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, defaultAppState);
  const context = useMemo<PageStateContextValue>(() => [state, dispatch], [state]);

  return <PageStateContext value={context}>{children}</PageStateContext>;
};
