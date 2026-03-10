import useAppState from "@/context/useAppState";
import ChatController from "@/data/ChatController";
import SearchController from "@/data/SearchController";
import { CortexSearchFilter, ErrorMessage, LoadingFitParent } from "@spcs-apps/data-utils";
import { Box } from "@spcs-apps/page-parts";
import { useState } from "react";
import ChatInput from "./ChatInput";
import { getFilterObject } from "./getFilterObject";
import getRagPrompt from "@/data/getRagPrompt";
import { saveHistory } from "./savedHistory";
import useConfigOptions from "@/hooks/useConfigOptions";
import ChatOptions from "./ChatOptions";
import ChatHistory from "./ChatHistory";
import ChatFollowup from "./ChatFollowup";
import SupportLinkList from "./SupportLinkList";
import SearchReults from "./SearchResults";

interface ChatProps {
  chatController?: ChatController | null;
  searchController?: SearchController | null;
  partialText?: string;
}

export default function Chat({ chatController, searchController, partialText }: ChatProps) {
  "use no memo";
  const [{ appConfig, dataCache, optionValues }] = useAppState();
  const [isPending, setIsPending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<Error | undefined>(undefined);
  const [searchError, setSearchError] = useState<Error | undefined>(undefined);
  const [hideOptionsError, setHideOptionsError] = useState<boolean>(false);

  const {
    options,
    isLoading: optionsIsLoading,
    error: optionsError,
  } = useConfigOptions(appConfig?.appId, appConfig?.hasOptions);

  if (!appConfig) {
    return undefined;
  }

  const history = chatController?.history;
  const searchResults = searchController?.results;

  /** do this when user submits the question */
  const handleSubmit = (question: string) => {
    setChatError(undefined);
    setSearchError(undefined);
    // search then chat
    if (searchController && SearchController.hasSearch(appConfig)) {
      // clear previous results and history before sending a new message
      // this itself will not cause a new render, so put above something that will
      chatController?.clearHistory();
      searchController.clearResults();
      let filter: CortexSearchFilter | undefined = undefined;
      if (appConfig.hasOptions && optionValues) {
        filter = getFilterObject(options, optionValues);
      }
      setIsPending(true);
      searchController
        .search(question, filter)
        .then(() => {
          // chat after search
          if (chatController) {
            const initialMessage = getRagPrompt(searchController?.results, appConfig);
            chatController.initialMessage = initialMessage ? [initialMessage] : [];
            chatController
              .sendMessage(question)
              .then(() => {
                setIsPending(false);
                // save history
                saveHistory(dataCache, searchController, chatController).catch((e) => {
                  console.error("error saving history", e);
                });
              })
              .catch((e) => {
                console.error(e);
                setIsPending(false);
                setChatError(e as Error);
              });
          } else {
            // no chat afterwards, end pending
            setIsPending(false);
          }
        })
        .catch((e) => {
          console.error(e);
          setIsPending(false);
          setSearchError(e as Error);
        });
    } else if (chatController) {
      // chat without search
      chatController?.clearHistory();
      setIsPending(true);
      chatController
        .sendMessage(question)
        .then(() => {
          setIsPending(false);
          // save history
          saveHistory(dataCache, searchController, chatController).catch((e) => {
            console.error("error saving history", e);
          });
        })
        .catch((e) => {
          console.error(e);
          setIsPending(false);
          setChatError(e as Error);
        });
    }
  };

  /** add a follow up question to the current chat history */
  const handleFollowup = (question: string) => {
    setChatError(undefined);
    if (chatController) {
      setIsPending(true);
      chatController
        .sendMessage(question)
        .then(() => {
          setIsPending(false);
          // save history
          saveHistory(dataCache, searchController, chatController).catch((e) => {
            console.error("error saving history", e);
          });
        })
        .catch((e) => {
          console.error(e);
          setIsPending(false);
          setChatError(e as Error);
        });
    }
  };

  // Have App Config, normal output
  return (
    <div className="m-3 grid grid-cols-1 items-center justify-items-center gap-y-3">
      <Box className="w-full p-2 xl:w-9/10">
        <ChatInput
          isPending={isPending}
          hasHistory={history && history.length > 0}
          onSubmit={handleSubmit}
        />
        {appConfig?.hasOptions && (
          <div className="relative">
            <ChatOptions options={options} />
            {optionsIsLoading && <LoadingFitParent>Loading App Options</LoadingFitParent>}
          </div>
        )}
      </Box>
      {history && history.length > 0 && (
        <Box className="w-full p-2 xl:w-9/10">
          <ChatHistory
            history={history}
            isPending={isPending}
            partialContent={partialText || undefined}
          />
          <ChatFollowup isPending={isPending} onSubmit={handleFollowup} />
        </Box>
      )}
      <div
        className={`grid w-full grid-cols-1 gap-3 ${appConfig.supportLinks ? "md:grid-cols-2" : ""} xl:w-9/10`}
      >
        {appConfig.cortexSearchDocuments && (
          <Box className="w-full p-2">
            <SearchReults
              results={searchResults}
              nameColumn={appConfig.cortexSearchDocuments.nameField}
              urlColumn={appConfig.cortexSearchDocuments.urlField}
              contentColumn={appConfig.cortexSearchDocuments.contentField}
              display={appConfig.cortexSearchDocuments.display}
              noChunkText={appConfig.cortexSearchDocuments.noChunkText}
              formatName={appConfig.cortexSearchDocuments.formatName}
            />
          </Box>
        )}
        {appConfig.supportLinks && (
          <Box className="w-full p-2">
            {" "}
            <SupportLinkList supportLinks={appConfig.supportLinks} />
          </Box>
        )}
      </div>
      {chatError && (
        <ErrorMessage
          error={chatError}
          message="Failed to get a Chat Answer"
          onClose={() => setChatError(undefined)}
        />
      )}
      {searchError && (
        <ErrorMessage
          error={searchError}
          message="Failed to get Related Documents"
          onClose={() => setSearchError(undefined)}
        />
      )}
      {optionsError && !hideOptionsError && (
        <ErrorMessage
          error={optionsError}
          message="Failed to load additional options"
          onClose={() => setHideOptionsError(true)}
        />
      )}
    </div>
  );
}
