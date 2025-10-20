import fs from "node:fs";
import path from "node:path";
import logger from "../logging/logger.js";

const cacheDir = "./.cache";

/** Makes the cacheDir if it does not already exist.
 * @throws on creation error
 */
async function makeCacheDir() {
  await new Promise((resolve) => {
    fs.mkdir(path.resolve(cacheDir), { recursive: true }, (err) => {
      if (err) {
        logger.error("unable to create cache directory", err);
      }
      resolve(undefined);
    });
  });
}

/** Save the given content to the local cache files directory
 * @param fileName file name to save. Example: "myfile.json"
 * @param contents the file contents, as a string
 * @throws on file write error
 */
export async function writeCacheFile(fileName: string, contents: string) {
  await makeCacheDir();
  const filePath = path.resolve(cacheDir, fileName);
  await new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, (err) => {
      if (err) {
        reject(err);
      }
      resolve(undefined);
    });
  });
}

/** Read a file from the local cache files directory
 * @param fileName the file name to read. Example: "myfile.json"
 * @returns the string contents of the file, or undefined if file does not exist
 * @throws on file read error
 */
export async function readCacheFile(fileName: string): Promise<string | undefined> {
  const filePath = path.resolve(cacheDir, fileName);
  const data = await new Promise<string | undefined>((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        if ("code" in err && err.code === "ENOENT") {
          logger.debug("no local cache file exists: " + fileName);
          resolve(undefined);
        } else {
          reject(err);
        }
      } else {
        resolve(data);
      }
    });
  });
  return data;
}

export interface AppendDatedFileOptions {
  extension?: string;
  outsideCacheDir?: boolean;
}

/** Append content to a file, creating file if it does not exist.
 * File will have the current date added to the name, fileName_YYYYMMDD[extension | .txt]
 * @param fileName file name to use, without extension
 * @param contents content to append
 */
export async function appendDatedFile(
  fileName: string,
  contents: string,
  options: AppendDatedFileOptions = {},
) {
  const isoDate = new Date().toISOString();
  const extension = options.extension || ".txt";
  const fullFileName =
    fileName +
    "_" +
    isoDate.substring(0, 4) +
    isoDate.substring(5, 7) +
    isoDate.substring(8, 10) +
    (extension.at(0) === "." ? extension : "." + extension);

  if (!options.outsideCacheDir) {
    await makeCacheDir();
  }
  const filePath = options.outsideCacheDir
    ? path.resolve(fullFileName)
    : path.resolve(cacheDir, fullFileName);
  await new Promise((resolve, reject) => {
    fs.appendFile(filePath, contents, (err) => {
      if (err) {
        reject(err);
      }
      resolve(undefined);
    });
  });
}
