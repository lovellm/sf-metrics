import userCache from "../utils/userCache";
import { useRef, useState } from "react";

export interface UseUserResult {
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
  const didCheck = useRef<null | true>(null);

  if (didCheck.current === null) {
    didCheck.current = true;
    const roles = role ? (Array.isArray(role) ? role : [role]) : undefined;
    userCache
      .getUserInfo(roles)
      .then((resultData) => {
        if (requireAll) {
          if (roles?.length === resultData?.roles?.length) {
            setResult({
              user: resultData.user,
              inRole: true,
            });
          }
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

/** use to manually set the userid and roles for the userCache.
 * should only be called in local development
 */
export function localUserOverride(userId?: string, roles?: string | string[]) {
  if (userId) {
    userCache.userId = userId;
  }
  if (roles) {
    if (Array.isArray(roles)) {
      roles.forEach((r) => {
        userCache.checkedRoles[r] = true;
      });
    } else if (typeof roles === "string") {
      userCache.checkedRoles[roles] = true;
    }
  }
}
