import { AppConfig, ChatHistoryEntry } from "@/constants";
import ChatController from "@/data/ChatController";
import SearchController from "@/data/SearchController";
import { DataCache, sha1 } from "@spcs-apps/data-utils";

export async function saveHistory(
  dataCache: DataCache,
  searchController?: SearchController | null,
  chatController?: ChatController | null,
  /** if given, use hash of this as key instead of hash of question */
  keyString?: string,
): Promise<boolean> {
  if (!dataCache || !searchController || !chatController) {
    return false;
  }
  const question = chatController.getFirstQuestion();
  if (!question) {
    return false;
  }

  const key = await sha1(keyString || question);
  const entry: ChatHistoryEntry = {
    key: key,
    question: question,
    history: chatController.history,
    docs: searchController.results,
    usage: chatController.getCurrentUsage(),
    timestamp: new Date().valueOf(),
  };
  await dataCache.putData(key, entry, -1);
  return true;
}

export async function loadHistory(
  key: string,
  dataCache: DataCache,
  searchController?: SearchController | null,
  chatController?: ChatController | null,
  appConfig?: AppConfig,
): Promise<boolean> {
  if (!key || !dataCache || !searchController || !chatController || !appConfig) {
    console.warn("attempted to loadHistory, but missing a parameter");
    return false;
  }
  const savedHistory = await dataCache.getData<ChatHistoryEntry>(key, -1);
  if (!savedHistory) {
    console.warn("attempted to load history, but no getData result");
    return false;
  }
  searchController.loadSavedHistory(savedHistory);
  chatController.loadSavedHistory(savedHistory, appConfig);

  return true;
}
