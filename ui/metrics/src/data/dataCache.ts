import { IDBPDatabase, openDB } from "idb";
import { appVersion, clearLocalStorage } from "../constants";

// const days90 = 1000 * 60 * 60 * 24 * 90;
const days30 = 1000 * 60 * 60 * 24 * 30;
const days10 = 1000 * 60 * 60 * 24 * 10;
const hours8 = 1000 * 60 * 60 * 8;
const defaultExpireAge = import.meta.env.DEV ? days10 : hours8;
const cacheVersionKey = "__appVersion";
const currentUserKey = "__cacheForUser";

interface CacheRecord<T> {
  id: string;
  data: T;
  timestamp: number;
  expireAt?: number;
  /** if true, will not count towards max kept cache records */
  noLimit?: boolean;
}
interface AppVersionRecord {
  id: string;
  appVersion: string;
}
interface AppUserRecord {
  id: string;
  userId: string;
}
interface DataCacheOptions {
  storeName?: string;
  dbVersion?: number;
  /** max age of cache to return */
  expireAge?: number;
  /** max number of cached entries to keep during cleanup */
  maxCachedToKeep?: number;
  /** age in ms of oldest entries to keep during cleanup */
  oldestCachedToKeep?: number;
  /** if true, skip cleanup step */
  noCleanup?: boolean;
  appVersion?: string;
  clearLocalStorage?: () => void;
}

/** Wraps data in a cache record to save in the cache
 * @param key key for the data
 * @param data data to save
 * @returns wrapped data in a cache record
 */
function createCacheRecord<T>(
  key: string,
  data: T,
  ttl?: number,
  noLimit?: boolean,
): CacheRecord<T> {
  const now = new Date().valueOf();
  let expireAt: number | undefined = undefined;
  if (ttl) {
    if (ttl < 0) {
      expireAt = -1;
    } else {
      expireAt = now + ttl;
    }
  }
  return {
    id: key,
    data: data,
    timestamp: now,
    expireAt: expireAt,
    noLimit: noLimit,
  };
}

/** Unwraps data from the cache, ignoring it if it is too old
 * @param record the cache record
 * @param cacheTime maximum age for cache to still be good, in ms
 * @returns the unwrapped data from the cache
 */
function dataFromCacheRecord<T>(record: CacheRecord<T>, expireMs?: number): T | undefined {
  if (record && record.data && record.timestamp) {
    // undefined expire age given, use negative for no exire
    const expire = expireMs ?? -1;
    if (!window.navigator.onLine) {
      // Offline, use the cache regardless of age
      return record.data;
    } else {
      const now = new Date().valueOf();
      if (record.expireAt && record.expireAt > 0 && record.expireAt < now) {
        // data expired
        return undefined;
      }
      if (expire < 0) {
        // expire age negative, no expire, return data
        return record.data;
      }
      if (now - record.timestamp < expire) {
        // Cache is within age, use it
        return record.data;
      }
      // Cache too old, do not use it
    }
  }
  return undefined;
}

/** If the cache is for an old version of the app, clear it. Otherwise does nothing
 * @param dbPromise IDB promise resolving to the database
 * @returns same dbPromise that was given to it
 */
async function checkCacheVersion(
  dbPromise: Promise<IDBPDatabase<unknown>>,
  storeName: string,
  appVersion?: string,
): Promise<IDBPDatabase<unknown>> {
  try {
    const db = await dbPromise;
    const versionRecord = (await db.get(storeName, cacheVersionKey)) as AppVersionRecord;
    if (!versionRecord || versionRecord.appVersion !== appVersion) {
      // eslint-disable-next-line no-console
      console.log("Clearing Cache due to new App Version");
      // No version number in cache, or different than current. Clear cache and set it
      await db.clear(storeName);
      await db.put(storeName, { id: cacheVersionKey, appVersion: appVersion });
    }
    // Else version matches, do nothing
  } catch (e) {
    console.error("Error Checking Cached App Version");
  }
  return dbPromise;
}

export class DataCache {
  private dbPromise?: Promise<IDBPDatabase<unknown>>;
  dbName?: string;
  private storeName: string = "";
  private dbVersion: number = 0;
  private expireAge: number = defaultExpireAge;
  private maxCachedToKeep: number | undefined;
  private oldestCachedToKeep: number | undefined;
  private clearLocalStorage?: () => void;

  constructor(dbName?: string, options: DataCacheOptions = {}) {
    if (dbName && options.storeName) {
      this.open(dbName, options);
    }
  }

  /** open the provided database, closing any that are already open */
  open(dbName: string, options: DataCacheOptions = {}) {
    if (this.dbPromise) {
      this.close();
    }
    const storeName = options.storeName || "cache";
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbVersion = options.dbVersion ?? 1;
    this.expireAge = options.expireAge || defaultExpireAge;
    this.maxCachedToKeep = options.maxCachedToKeep;
    this.oldestCachedToKeep = options.oldestCachedToKeep;
    this.clearLocalStorage = options.clearLocalStorage;

    if ("indexedDB" in window) {
      const dbPromise = openDB(dbName, this.dbVersion, {
        upgrade: (db, oldVersion) => {
          switch (oldVersion) {
            case 0:
              if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, { keyPath: "id" });
                objectStore.createIndex("timestamp", "timestamp", { unique: false });
              }
          }
        },
      });
      this.dbPromise = checkCacheVersion(dbPromise, storeName, options.appVersion);
      if (options.noCleanup !== true) {
        this.cleanupOld().catch(() => undefined);
      }
    } else {
      console.error("No Indexed DB!");
    }
  }

  /** retrieve the cached data for the given key
   * @param key key for the cache record
   * @param cacheAge max cache age to return, instead of the default
   * @returns the cached data, or undefined if it is expired or does not exist
   */
  async getData<T>(key: string, cacheAge?: number): Promise<T | undefined> {
    if (!this.dbPromise) {
      return undefined;
    }
    try {
      const db = await this.dbPromise;
      const record = (await db.get(this.storeName, key)) as CacheRecord<T>;
      const data = dataFromCacheRecord<T>(record, cacheAge ?? this.expireAge);
      if (data) {
        return data;
      }
    } catch (e) {
      // log the error, but ignore it and just say nothing was in the cache
      console.error("Error Reading from Cache", e);
    }
    return undefined;
  }

  /** add the given data to the cache
   * @param key the key in which to store the data
   * @param data data to cache
   */
  async putData<T>(key: string, data: T, ttl?: number, noLimit?: boolean): Promise<boolean> {
    if (!this.dbPromise) {
      return false;
    }
    try {
      const record = createCacheRecord(key, data, ttl, noLimit);
      const db = await this.dbPromise;
      await db.put(this.storeName, record);
    } catch (e) {
      // log the error, but ignore, future requests will just not be able to use it
      console.error("Error Saving to Cache", e);
    }
    return true;
  }

  /** delete a cache record
   * @param key the key to delete
   */
  async deleteData(key: string): Promise<boolean> {
    if (!this.dbPromise) {
      return false;
    }
    try {
      const db = await this.dbPromise;
      await db.delete(this.storeName, key);
    } catch (e) {
      // log the error, but ignore
      console.error("Error Deleting Key", e);
    }
    return true;
  }

  /** Make sure the cached data was retrieved with the currently logged in user.
   * The only time it would not be is if the session expired and a different login was used.
   * A log out will automatically clear it.
   */
  async verifyCurrentUser(userId: string): Promise<boolean> {
    if (!this.dbPromise) {
      return false;
    }
    try {
      const db = await this.dbPromise;
      const record = (await db.get(this.storeName, currentUserKey)) as AppUserRecord;
      if (record) {
        // cached Data is for given user, return true and be happy
        if (record.userId === userId) {
          return true;
        }

        // cached Data is for different user, clear data
        if (record.userId) {
          console.warn("Cached Data for Different User, Clearing");
          await this.clear();
        }
      }

      // add current user as the cache user
      await db.put(this.storeName, { id: currentUserKey, userId: userId });
      return true;
    } catch (e) {
      console.error("Error Reading from Cache", e);
    }
    return false;
  }

  /** clear the indexed db cache
   * @param alsoLocalStorage if true, also clear local storage
   */
  async clear(alsoLocalStorage?: boolean) {
    if (!this.dbPromise) {
      return;
    }
    const db = await this.dbPromise;
    await db.clear(this.storeName);

    if (alsoLocalStorage && typeof this.clearLocalStorage === "function") {
      this.clearLocalStorage();
    }
  }

  /** remove any entries that are expired */
  async cleanupOld() {
    if (!this.dbPromise) {
      return false;
    }
    try {
      // console.log("Cleaning Up Local Cache");
      const now = new Date().valueOf();
      const db = await this.dbPromise;
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const index = store.index("timestamp");
      const count = await index.count();
      let checked = 0;
      let checkedKeep = 0;
      const toDelete = [];
      const cursor = await index.openCursor();
      while (cursor && checked < count) {
        checked += 1;
        const val = cursor.value as CacheRecord<unknown>;
        if (val.noLimit) {
          checkedKeep += 1;
        }
        const time = cursor.key as number;
        if (this.oldestCachedToKeep && time < this.oldestCachedToKeep) {
          // Old, delete it
          toDelete.push(cursor.primaryKey);
        } else if (val.expireAt && val.expireAt >= 0 && val.expireAt < now) {
          // Should expire, delete it
          toDelete.push(cursor.primaryKey);
        } else if (this.maxCachedToKeep && count - (checked - checkedKeep) > this.maxCachedToKeep) {
          if (!val.noLimit && (!val.expireAt || val.expireAt > 0)) {
            // Too many cached, delete it (unless expireAt is negative)
            toDelete.push(cursor.primaryKey);
          }
        }
        await cursor.continue();
      }
      for (let i = 0; i < toDelete.length; i++) {
        const deleteKey = toDelete[i];
        if (deleteKey) {
          await store.delete(deleteKey);
        }
      }
      await tx.done;
      // console.log(`Checked ${checked} entries, removed ${toDelete.length} of ${count} entries`);
    } catch (e) {
      // Log the error, but ignore
      console.error("Error Cleaning Up Old IndexDB Records", e);
    }
    return true;
  }

  /** get all entries with a certain property */
  async listEntries<T extends object>(property: string): Promise<T[]> {
    if (!this.dbPromise) {
      return [];
    }
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.storeName);
      const store = tx.objectStore(this.storeName);
      let cursor = await store.openCursor();
      const list: T[] = [];
      while (cursor) {
        const val = cursor.value as CacheRecord<T>;
        if (val.data && property in val.data) {
          list.push(val.data);
        }
        cursor = await cursor.continue();
      }
      await tx.done;
      return list;
    } catch (e) {
      throw new Error("error listing cache entries: " + (e as Error).message);
    }
  }

  close() {
    if (!this.dbPromise) {
      return undefined;
    }
    this.dbPromise
      .then((db) => {
        db.close();
      })
      .catch((e) => {
        console.error("error closing idb", e);
      });
    this.dbPromise = undefined;
  }
}

export const defaultCacheOptions: DataCacheOptions = {
  storeName: "cache",
  dbVersion: 1,
  expireAge: defaultExpireAge,
  maxCachedToKeep: 80,
  oldestCachedToKeep: days30,
  appVersion: appVersion,
  clearLocalStorage: clearLocalStorage,
};

export const defaultCache = new DataCache("sfm", defaultCacheOptions);
