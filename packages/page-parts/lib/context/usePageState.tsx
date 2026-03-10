import { use } from "react";
import { PageStateContext } from "./PageState";

export default function usePageState() {
  return use(PageStateContext);
}
