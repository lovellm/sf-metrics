import { createContext } from "react";
import { SelectedValues } from "@/types/filterTypes";

export interface AppState {
  isFiltersOpen?: boolean;
  filters?: SelectedValues;
}
export const defaultAppState: AppState = {};

export type AppStateAction =
  | { type: "toggleFiltersOpen"; payload?: undefined }
  | { type: "setFilters"; payload?: SelectedValues };

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  const { type, payload } = action;
  switch (type) {
    case "toggleFiltersOpen":
      return { ...state, isFiltersOpen: !state.isFiltersOpen };
    case "setFilters":
      return { ...state, filters: payload };
    default:
      return state;
  }
}

export type AppStateContextValue = [AppState, React.ActionDispatch<[action: AppStateAction]>];
const defaultContext: AppStateContextValue = [{}, () => undefined];
export const AppStateContext = createContext<AppStateContextValue>(defaultContext);
