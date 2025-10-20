/** returns the api base, no trailing slash */
export const getApiBase = (): string => {
  return import.meta.env.VITE_API_BASE || window.location.origin;
};
/** given an endpoint, returns the url to that endpoint */
export const getApiUrl = (endpoint: string = "") => {
  return getApiBase() + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
};
/** returns the endpoint for the given action, with leading slash */
export type EndpointType = "query" | "generateQuery" | "user";
export const getEndpoint = (action: EndpointType): string => {
  switch (action) {
    case "query":
      return "/api/query";
    case "generateQuery":
      return "/api/generateQuery";
    case "user":
      return "/api/user";
  }
  return "";
};
/** shortcut for calling getApiUrl(getEndpoint(endpoint)) */
export const getApiUrlForEndpoint = (endpoint: EndpointType): string => {
  return getApiUrl(getEndpoint(endpoint));
};
