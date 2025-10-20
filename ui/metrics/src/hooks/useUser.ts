import userCache from "@/data/userCache";
import { useRef, useState } from "react";

interface UseUserResult {
  user: string;
  inRole?: boolean;
}

/** get the user id and whether in the given role(s).
 * note: only the props given to it on first render will be used.
 * changing them later will not change the result
 */
export default function useUser(
  role?: string | string[],
  requireAll?: boolean,
): UseUserResult | undefined {
  const [result, setResult] = useState<UseUserResult | undefined>(undefined);
  const didCheck = useRef<boolean>(false);

  if (!didCheck.current) {
    didCheck.current = true;
    const roles = role ? (Array.isArray(role) ? role : [role]) : undefined;
    userCache
      .getUserInfo(roles)
      .then((resultData) => {
        if (requireAll && roles?.length === resultData?.roles?.length) {
          setResult({
            user: resultData.user,
            inRole: true,
          });
        } else if (resultData?.roles?.length) {
          setResult({
            user: resultData.user,
            inRole: true,
          });
        } else {
          setResult({
            user: resultData.user,
            inRole: false,
          });
        }
      })
      .catch((e) => {
        console.warn("error in useUser", e);
      });
  }

  return result;
}
