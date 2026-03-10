import { CortexSearchResultRow, makeGetString } from "@spcs-apps/data-utils";
import { useMemo } from "react";
import { PiEye } from "react-icons/pi";
import SearchResultContent from "./SearchResultContent";
import { usePageState } from "@spcs-apps/page-parts";

interface SearchResultsProps {
  results?: CortexSearchResultRow[];
  nameColumn: string;
  urlColumn?: string;
  contentColumn?: string;
  display?: "unique" | "none";
  noChunkText?: boolean;
  formatName?: boolean;
}

export default function SearchReults({
  results: resultsIn,
  nameColumn,
  urlColumn,
  contentColumn,
  display,
  noChunkText,
  formatName,
}: SearchResultsProps) {
  const [, dispatch] = usePageState();
  const { results, getName, getUrl, getContent } = useMemo(() => {
    const getName = makeGetString(nameColumn);
    const getUrl = makeGetString(urlColumn);
    const getContent = makeGetString(contentColumn);
    let results = resultsIn;

    if (display === "unique") {
      const resultMap: Record<string, CortexSearchResultRow> = {};
      resultsIn?.forEach((row) => {
        const name = getName(row);
        const url = getUrl(row);
        const key = (name || "") + (url || "");
        if (!resultMap[key]) {
          resultMap[key] = row;
        } else if (contentColumn && typeof resultMap[key][contentColumn] === "string") {
          const content = getContent(row);
          resultMap[key][contentColumn] += "\n" + content;
        }
      });
      results = Object.values(resultMap);
    }

    return {
      results,
      getName,
      getUrl,
      getContent,
    };
  }, [nameColumn, urlColumn, contentColumn, display, resultsIn]);

  const hasResults = results && results.length > 0;

  if (display === "none") {
    return null;
  }

  return (
    <div>
      <div className="font-bold">Supporting Documents</div>
      {hasResults && (
        <div className="list px-2">
          <ul>
            {results.map((row, i) => {
              const name = getName(row);
              const formattedName = formatName ? formatDocumentName(name) : name;
              const url = getUrl(row);
              const content = getContent(row);
              return (
                <li key={name + i}>
                  <div className="flex items-center gap-x-2">
                    {url ? (
                      <a href={url} className="a-main" target="_blank" rel="noreferrer">
                        {formattedName}
                      </a>
                    ) : (
                      <span>{formattedName}</span>
                    )}
                    {content && !noChunkText && (
                      <button
                        type="button"
                        className="hover:text-accent-link cursor-pointer text-sm"
                        onClick={() => {
                          dispatch({
                            type: "setOverlay",
                            payload: (
                              <SearchResultContent name={name} url={url} content={content} />
                            ),
                          });
                        }}
                      >
                        <PiEye />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {hasResults ? (
        <div>These documents were given to the LLM to answer your question.</div>
      ) : (
        <div>Documents related to your question will be listed here.</div>
      )}
    </div>
  );
}

const formatDocumentName = (n: string): string => {
  try {
    if (!n || typeof n !== "string") {
      return "";
    }
    return n
      .split(/\W/)
      .map((word) => {
        if (word && word.length > 1) {
          return word.charAt(0)?.toUpperCase() + word.substring(1);
        } else {
          return word;
        }
      })
      .join(" ");
  } catch (e) {
    return n;
  }
};
