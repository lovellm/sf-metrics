import { appVersion } from "@/constants";
import { DataCache, getDefaultCacheOptions } from "@spcs-apps/data-utils";

const cacheOptions = getDefaultCacheOptions();
cacheOptions.appVersion = appVersion;
export const defaultCache = new DataCache("sfm", cacheOptions);
