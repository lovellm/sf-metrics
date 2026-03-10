import { AppConfig } from "../constants";
import { CortexSearchResultRow, InferenceMessage, makeGetString } from "@spcs-apps/data-utils";

const getContentMessage = (context?: string) => {
  return `You are a chatbot for answering business questions by employees.
Use the provided document context to answer the questions they ask.
If the context does not provide enough information to answer, simply reply that you do not have that information.
Do not say things such as "according to the provided documents".
<context>${context}</context>`;
};

export default function getRagPrompt(
  searchResults?: CortexSearchResultRow[],
  appConfig?: AppConfig,
): InferenceMessage | undefined {
  if (!searchResults?.length || !appConfig?.cortexSearchDocuments?.contentField) {
    return {
      role: "system",
      content: getContentMessage("No relevant context was found"),
    };
  }
  const getContent = makeGetString(appConfig.cortexSearchDocuments.contentField);
  const getName = makeGetString(appConfig?.cortexSearchDocuments?.nameField);
  const contextData = searchResults.reduce(
    (a, row) =>
      a +
      `<document${appConfig?.cortexSearchDocuments?.nameField ? ' name="' + getName(row) + '"' : ""}>${getContent(row)}</document>\n`,
    "",
  );
  return {
    role: "system",
    content: getContentMessage(contextData),
  };
}
