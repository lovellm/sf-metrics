import { createContext } from "react";

export const LS_KEY_THEME = "theme";

// get dark mode based on saved preference or system preference
const defaultIsDark =
  localStorage[LS_KEY_THEME] === "dark" ||
  (!(LS_KEY_THEME in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark", defaultIsDark);

export interface AppState {
  isDark?: boolean;
  isMenuOpen?: boolean;
  overlay?: React.ReactNode;
}
export const defaultAppState: AppState = {
  isDark: defaultIsDark,
};

export type AppStateAction =
  | { type: "setIsDark"; payload: boolean }
  | { type: "setIsMenuOpen"; payload?: boolean }
  | { type: "setOverlay"; payload?: React.ReactNode };

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  const { type, payload } = action;
  switch (type) {
    case "setIsDark": {
      localStorage[LS_KEY_THEME] = payload ? "dark" : "light";
      document.documentElement.classList.toggle("dark", payload);
      return { ...state, isDark: payload };
    }
    case "setIsMenuOpen":
      return { ...state, isMenuOpen: payload };
    case "setOverlay":
      return { ...state, overlay: payload };
    default:
      return state;
  }
}

export type PageStateContextValue = [AppState, React.ActionDispatch<[action: AppStateAction]>];
const defaultContext: PageStateContextValue = [{}, () => undefined];
export const PageStateContext = createContext<PageStateContextValue>(defaultContext);
