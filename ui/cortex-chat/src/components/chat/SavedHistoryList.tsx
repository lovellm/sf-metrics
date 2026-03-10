import { ChatHistoryEntry } from "@/constants";
import useAppState from "@/context/useAppState";
import ChatController from "@/data/ChatController";
import SearchController from "@/data/SearchController";
import { ErrorMessage, LoadingFitParent } from "@spcs-apps/data-utils";
import { Box } from "@spcs-apps/page-parts";
import { useEffect, useMemo, useState } from "react";
import { IoClose, IoStar, IoStarOutline } from "react-icons/io5";
import { PiChatTeardropText } from "react-icons/pi";
import { loadHistory } from "./savedHistory";

interface SavedHistoryListProps {
  searchController?: SearchController | null;
  chatController?: ChatController | null;
}

export default function SavedHistoryList({
  searchController,
  chatController,
}: SavedHistoryListProps) {
  const [search, setSearch] = useState<string>("");
  const [refreshHistory, setRefreshHistory] = useState<number>(0);
  const [{ dataCache, appConfig }, dispatch] = useAppState();
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [loadHistoryError, setLoadHistoryError] = useState<Error | undefined>(undefined);

  // load the chat history from cache
  useEffect(() => {
    const fun = () => {
      setIsLoadingHistory(true);
      dataCache
        .listEntries<ChatHistoryEntry>("question")
        .then((list) => {
          list.sort((a, b) => {
            const favs = ((b.favorite && 1) || 0) - ((a.favorite && 1) || 0);
            if (favs) {
              return favs;
            }
            return (b.timestamp ?? 0) - (a.timestamp ?? 0);
          });
          setHistory(list);
          setIsLoadingHistory(false);
        })
        .catch((e) => {
          console.error(e);
          setLoadHistoryError(e as Error);
          setIsLoadingHistory(false);
        });
    };
    fun();
  }, [refreshHistory, dataCache]);

  const filteredHistory = useMemo(() => {
    if (!history) {
      return [];
    }
    if (!search) {
      return history;
    }
    return history.filter((h) => h.question?.toUpperCase().includes(search.toUpperCase()));
  }, [history, search]);

  return (
    <div className="m-3 grid grid-cols-1 items-center justify-items-center gap-y-3">
      <Box className="relative grid w-full grid-cols-1 text-center">
        <div className="flex flex-col items-center px-4 py-2 font-bold">Question History</div>
        <div className="w-full px-4 xl:pr-12 xl:pl-12">
          <input
            className="input-main mb-2 w-72 resize-none rounded-full border px-4 py-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search History"
          />
          {!filteredHistory || !filteredHistory.length ? (
            <div>No {search ? "Matching" : ""} Question History</div>
          ) : (
            <div>
              {filteredHistory.map((entry) => (
                <div key={entry.key} className="flex w-full">
                  {/* Favorite history button */}
                  <button
                    type="button"
                    className="flex shrink-0 grow-0 cursor-pointer items-center rounded-full px-1 hover:bg-yellow-600 hover:text-white"
                    title="Toggle as a Favorite"
                    onClick={() => {
                      if (entry.key) {
                        dataCache
                          .putData(entry.key, { ...entry, favorite: !entry.favorite }, -1)
                          .then(() => {
                            setRefreshHistory(new Date().valueOf());
                          })
                          .catch((e) => {
                            console.error("updating history cache record", e);
                            setLoadHistoryError(e as Error);
                          });
                      }
                    }}
                  >
                    {entry.favorite ? <IoStar /> : <IoStarOutline />}
                  </button>
                  {/* Initial question button, loads that question history */}
                  <button
                    type="button"
                    className="hover:bg-accent-link hover:text-accent-light flex shrink grow cursor-pointer overflow-hidden px-2 text-ellipsis whitespace-nowrap"
                    onClick={() => {
                      loadHistory(entry.key, dataCache, searchController, chatController, appConfig)
                        .then(() => {
                          dispatch({ type: "setShowSavedHistory", payload: false });
                        })
                        .catch((e) => {
                          console.error("error loading saved history", e);
                        });
                    }}
                  >
                    {entry.question}
                  </button>
                  {/* Delete history button */}
                  <button
                    type="button"
                    className="hover:bg-danger hover:text-accent-light flex shrink-0 grow-0 cursor-pointer items-center rounded-full px-1"
                    title="Remove from History"
                    onClick={() => {
                      if (entry.key) {
                        dataCache
                          .deleteData(entry.key)
                          .then(() => {
                            setRefreshHistory(new Date().valueOf());
                          })
                          .catch((e) => {
                            console.error("deleting history cache record", e);
                            setLoadHistoryError(e as Error);
                          });
                      }
                    }}
                  >
                    <IoClose />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center px-4 pt-1 pb-2 text-sm">
          Your previous questions and answers will be saved in this browser for up to 90 days or
          until you remove them.
          <div>Newest questions are listed first, with favorites above non-favorites.</div>
        </div>
        <div className="flex justify-end p-2">
          <button
            type="button"
            className="hover:bg-accent flex cursor-pointer items-center gap-x-2 rounded-full px-2 py-1 text-2xl"
            title="Ask a New Question"
            onClick={() => dispatch({ type: "setShowSavedHistory", payload: false })}
          >
            <PiChatTeardropText />
            <span className="text-sm">Ask as Question</span>
          </button>
        </div>
        {isLoadingHistory && <LoadingFitParent>Loading Question History...</LoadingFitParent>}
        {loadHistoryError && (
          <ErrorMessage message="unable to load question history" error={loadHistoryError} />
        )}
      </Box>
    </div>
  );
}
