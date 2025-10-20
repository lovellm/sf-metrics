import { use } from "react";
import { AppStateContext } from "./AppState";

export default function useAppState() {
  return use(AppStateContext);
}
