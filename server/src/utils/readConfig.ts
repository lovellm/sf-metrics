import fs from "node:fs";
import path from "node:path";
import logger from "../logging/logger.js";
import { ConfigError } from "../errors.js";

const configDir = "./config";

/** Read a config file from the config files directory
 * @param fileName the file name to read. Example: "myfile.json"
 * @returns the string contents of the file, or undefined if file does not exist
 * @throws on file read error
 */
export async function readConfigFile(fileName: string): Promise<string | undefined> {
  const filePath = path.resolve(configDir, fileName);
  const data = await new Promise<string | undefined>((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        if ("code" in err && err.code === "ENOENT") {
          logger.debug("no config file exists: " + fileName);
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

/** Read a json config file from the config files directory
 * @param fileName the file name to read. Example: "myfile.json"
 * @returns the JSON parsed contents of the file, or undefined if file does not exist
 * @throws if content content be parsed
 */
export async function readConfigJson<T>(fileName: string): Promise<T | undefined> {
  const text = await readConfigFile(fileName);
  if (!text) {
    return undefined;
  }
  try {
    const content = JSON.parse(text) as T;
    return content;
  } catch (e) {
    throw new ConfigError(`config file ${fileName} could not be parsed`);
  }
}
