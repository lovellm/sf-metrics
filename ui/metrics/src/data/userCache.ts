import { UserResponse } from "@/types/dataApi";
import { getApiUrlForEndpoint } from "./apiConstants";
import HttpRequest from "./HttpRequest";

/** utility class to get and cache user information */
class UserCache {
  pending: Record<string, Promise<UserResponse>> = {};
  checkedRoles: Record<string, boolean> = {};
  request: HttpRequest;
  userId?: string;

  constructor() {
    this.request = new HttpRequest({ noCache: true, timeout: 10000 });
  }

  /** Gets user information, first from cached info if exists, otherwise gets access token and takes from that */
  async getUserInfo(roles?: string[]): Promise<UserResponse> {
    const key = roles ? roles.join("|") : "";
    // we have a pending promise for this request, return that
    if (typeof this.pending[key] !== "undefined") {
      return this.pending[key];
    }

    // see if we have all needed information to respond without a new request
    if (this.userId) {
      const checkedRoles = this.getRolesIfChecked(roles);
      if (checkedRoles) {
        return {
          user: this.userId,
          roles: checkedRoles,
        };
      }
    }

    // Wrap the api request and save it, for parallel requests that come in before this resolves
    this.pending[key] = new Promise((resolve, reject) => {
      this.request
        .post<UserResponse>(getApiUrlForEndpoint("user"), { roles: roles })
        .then((result) => {
          if (result) {
            // cache the user id
            this.userId = result.user;
            // cache the roles that the user is in
            result.roles?.forEach((role) => {
              this.checkedRoles[role] = true;
            });
            // cache the roles that the user is not in
            roles?.forEach((role) => {
              // make sure not already set to true
              if (!this.checkedRoles[role]) {
                this.checkedRoles[role] = false;
              }
            });
            // can directly return the result. caches will be used for future calls
            resolve(result);
          } else {
            throw new Error("empty result from api/user");
          }
        })
        .catch((error) => {
          console.error("api/user threw an error", error);
          reject(error as Error);
        })
        .finally(() => {
          // request is done, local cache should be updated if possible, delete the pending request record
          delete this.pending[key];
        });
    });

    return this.pending[key];
  }

  /** given a list of roles, if all of them have already been checked, returns array of roles the user has.
   * if any have not been checked, returns undefined, meaning a new api request is needed.
   */
  private getRolesIfChecked(roles?: string[]): string[] | undefined {
    const checkedRoles: string[] = [];
    // did not request any roles, do not need to check, return empty role array and be good
    if (!roles) {
      return checkedRoles;
    }
    let checkedAll = true;
    roles.forEach((role) => {
      if (typeof this.checkedRoles[role] === "undefined") {
        // we have not yet checked this role. will need a new query
        checkedAll = false;
      } else if (this.checkedRoles[role] === true) {
        // we have checked this role and user has it, track it for response
        checkedRoles.push(role);
      }
      // else we have checked this role and user does not have it, leave out of response
    });
    if (checkedAll) {
      // we checked all roles, return membership from cache
      return roles;
    }
    // we have not checked all roles, need a new api request
    return undefined;
  }
}

const userCache = new UserCache();
export default userCache;
