import { createContext } from "react";
import { LocalStorageKeys } from "../constants";
import { SelectedValues } from "@/types/filterTypes";

// get dark mode based on saved preference or system preference
const defaultIsDark =
  localStorage[LocalStorageKeys.theme] === "dark" ||
  (!(LocalStorageKeys.theme in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark", defaultIsDark);

export interface AppState {
  isDark?: boolean;
  isMenuOpen?: boolean;
  isFiltersOpen?: boolean;
  filters?: SelectedValues;
  overlay?: React.ReactNode;
}
export const defaultAppState: AppState = {
  isDark: defaultIsDark,
};

export type AppStateAction =
  | { type: "setIsDark"; payload: boolean }
  | { type: "setIsMenuOpen"; payload?: boolean }
  | { type: "toggleFiltersOpen"; payload?: undefined }
  | { type: "setFilters"; payload?: SelectedValues }
  | { type: "setOverlay"; payload?: React.ReactNode };

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  const { type, payload } = action;
  switch (type) {
    case "setIsDark": {
      localStorage[LocalStorageKeys.theme] = payload ? "dark" : "light";
      document.documentElement.classList.toggle("dark", payload);
      return { ...state, isDark: payload };
    }
    case "setIsMenuOpen":
      return { ...state, isMenuOpen: payload };
    case "toggleFiltersOpen":
      return { ...state, isFiltersOpen: !state.isFiltersOpen };
    case "setFilters":
      return { ...state, filters: payload };
    case "setOverlay":
      return { ...state, overlay: payload };
    default:
      return state;
  }
}

export type AppStateContextValue = [AppState, React.ActionDispatch<[action: AppStateAction]>];
const defaultContext: AppStateContextValue = [{}, () => undefined];
export const AppStateContext = createContext<AppStateContextValue>(defaultContext);
