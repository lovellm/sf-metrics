import {
  CortexInferenceStreamChoice,
  CortexInferenceStreamData,
  CortexInferenceUsage,
  HttpFetch,
  HttpFetchOptions,
  InferenceMessage,
  InferenceRequest,
} from "@spcs-apps/data-utils";
import { AppConfig, ChatHistoryEntry, MessageWithTokens } from "../constants";
import getRagPrompt from "./getRagPrompt";

interface ChatControllerProps {
  contextLimit?: number;
  model?: string;
  initialMessages?: InferenceMessage[];
  fetchOptions?: HttpFetchOptions;
}

export const DEFAULT_CONTEXT_LIMIT = 4096;
export const DEFAULT_MODEL = "llama3.1-8b";
const CHAT_ENDPOINT = "/api/sf/api/v2/cortex/inference:complete";

const makeEmptyUsage = (): CortexInferenceUsage => {
  return {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0,
  };
};

type CallbackMessageUpdated = (
  currentText: string,
  deltaText: string,
  usage: CortexInferenceUsage,
) => void;
type CallbackComplete = (text: string, usage: CortexInferenceUsage) => void;

export default class ChatController {
  private usage: CortexInferenceUsage = makeEmptyUsage();
  #history: MessageWithTokens[] = [];
  private currentPrompt?: MessageWithTokens;
  private chunks: CortexInferenceStreamChoice[] = [];
  private currentUsage: CortexInferenceUsage = makeEmptyUsage();
  private currentText: string = "";
  private callbackMessageUpdated: CallbackMessageUpdated | undefined;
  private callbackComplete: CallbackComplete | undefined;
  private isPending: boolean = false;
  private fetcher: HttpFetch;

  asApi?: boolean;

  private contextLimit: number;
  #model: string;
  #initialMessage: InferenceMessage[];

  constructor({ contextLimit, model, fetchOptions, initialMessages }: ChatControllerProps = {}) {
    this.contextLimit = contextLimit || DEFAULT_CONTEXT_LIMIT;
    this.#model = model || DEFAULT_MODEL;
    this.#initialMessage = initialMessages || [];

    this.fetcher = new HttpFetch(fetchOptions);
  }

  async sendMessage(message: string) {
    if (this.isPending) {
      throw new Error("a message is already pending, wait for it");
    }
    this.currentPrompt = { role: "user", content: message, tokens: 0 } as MessageWithTokens;
    this.#history.push(this.currentPrompt);
    this.chunks = [];
    this.currentText = "";
    this.isPending = true;

    const history = this.messagesFromHistory();
    const messagesToSend: InferenceMessage[] = [...this.#initialMessage, ...history];

    try {
      const requestBody: InferenceRequest = {
        messages: messagesToSend,
        model: this.#model,
        asUser: !this.asApi,
      };
      const responseBody = await this.fetcher.postStream(CHAT_ENDPOINT, requestBody);

      await this.processEventStream(responseBody);
      // add this requests tokens to the totals
      this.usage.completion_tokens += this.currentUsage.completion_tokens;
      this.usage.prompt_tokens += this.currentUsage.prompt_tokens;
      this.usage.total_tokens += this.currentUsage.total_tokens;
      // add the full response text to the history
      this.#history.push({
        role: "assistant",
        content: this.currentText,
        tokens: this.currentUsage.completion_tokens,
      });
      if (typeof this.callbackComplete === "function") {
        this.callbackComplete(this.currentText, this.currentUsage);
      }
      this.isPending = false;
    } catch (e) {
      // set pending to false so it can be used again
      this.isPending = false;
      // then just rethrow the error
      throw e;
    }
  }

  /** get current prompt messages from the history. removes tokens and limits context size.
   * note: history already has current message appended to it.
   */
  private messagesFromHistory(): InferenceMessage[] {
    if (this.#history.length < 1) {
      return [];
    }
    // only allow history up to 60% of context limit to be sent
    const limit = this.contextLimit * 0.6;
    const toSend: InferenceMessage[] = [];
    let tokens = 0;
    // go through history starting with curret prompt (last index)
    for (let i = this.#history.length - 1; i >= 0; i--) {
      const message = this.#history[i];
      // accumulate tokens being sent
      tokens += message.tokens || 0;
      // if under the limit, add the message
      if (tokens < limit) {
        toSend.push({ content: message.content, role: message.role });
      } else {
        // otherwise falg message as out of context
        message.excluded = true;
      }
    }
    // reverse array so oldest is first
    toSend.reverse();
    // if oldest message is a response from assistant, remove it
    // need start of history to be a user question (can't respond to something that was not asked)
    if (toSend[0]?.role === "assistant") {
      toSend.shift();
    }

    return toSend;
  }

  /** given a stream from the Response object, get each chunk and process it. */
  private async processEventStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>> | null | undefined,
  ) {
    if (stream) {
      const decoder = new TextDecoder();
      const reader = stream.getReader();
      while (reader) {
        const streamChunk = await reader.read();
        if (streamChunk.value) {
          this.parseEventData(decoder.decode(streamChunk.value));
          // Add the prompt tokens from the chunk to the current prompt reference
          // only needed once, all chunks should have same value
          if (this.currentPrompt && this.currentUsage.prompt_tokens) {
            this.currentPrompt.tokens = this.currentUsage.prompt_tokens;
          }
        }
        if (streamChunk.done) {
          break;
        }
      }
    }
  }

  /** parses one chunk of the stream (as a string), spliting and processing it */
  private parseEventData(chunk: string) {
    // could have multiple records per chunk, split and filter out empty strings
    const parts = chunk.split("\n").filter((o) => o);
    let newText = "";
    parts.forEach((part) => {
      // should start with "data: " then be a JSON string
      const dataChunk = JSON.parse(part.substring(6)) as CortexInferenceStreamData;
      const choice = dataChunk.choices[0];
      if (!choice) {
        console.warn("data chunk had no choices object", dataChunk);
        return;
      }
      this.currentUsage = dataChunk.usage;
      this.chunks.push(choice);
      // if we have multi-model responses, will need to change this content and/or content_list
      newText += choice.delta.text || "";
    });
    // add all parts text to the current text
    this.currentText += newText;

    if (typeof this.callbackMessageUpdated === "function") {
      this.callbackMessageUpdated(this.currentText, newText, this.currentUsage);
    }
  }

  /** add or replace an callback for when a message chunk is processed */
  onMessageUpdated(callback?: CallbackMessageUpdated) {
    this.callbackMessageUpdated = callback;
  }

  /** add or replace a callback for when the full response is complete */
  onComplete(callback?: CallbackComplete) {
    this.callbackComplete = callback;
  }

  /** removes history and current information, that is, start a new chat with new message */
  clearHistory() {
    this.#history = [];
    this.#initialMessage = [];
    this.currentPrompt = undefined;
    this.chunks = [];
    this.currentUsage = makeEmptyUsage();
    this.currentText = "";
    this.isPending = false;
  }

  loadSavedHistory(savedHistory?: ChatHistoryEntry, config?: AppConfig) {
    if (!savedHistory || !config) {
      return;
    }
    this.#history = savedHistory.history || [];
    const initialPrompt = getRagPrompt(savedHistory.docs, config);
    if (initialPrompt) {
      this.#initialMessage = [initialPrompt];
    }
    this.currentUsage = savedHistory.usage || makeEmptyUsage();
    this.currentText = "";
    this.currentPrompt = undefined;
    this.chunks = [];
    this.isPending = false;
  }

  /** return the raw chunks from the latest response. probably no reason to ever use this */
  getResponseChunks() {
    return this.chunks;
  }

  /** returns the history of the chat */
  get history() {
    if (this.#history) {
      return [...this.#history];
    }
  }

  set initialMessage(message: InferenceMessage[]) {
    this.#initialMessage = message;
  }

  set model(m: string | undefined) {
    this.#model = m || DEFAULT_MODEL;
  }

  get model() {
    return this.#model;
  }

  getFirstQuestion() {
    if (this.#history && this.#history[0]?.role === "user") {
      return this.#history[0].content;
    }
    return "";
  }

  getCurrentUsage() {
    return this.currentUsage;
  }

  getTotalUsage() {
    return this.usage;
  }
}
