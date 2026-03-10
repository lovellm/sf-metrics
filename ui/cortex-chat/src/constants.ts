import {
  CortexInferenceUsage,
  CortexSearchResultRow,
  InferenceMessage,
} from "@spcs-apps/data-utils";

let version = "?";
let buildDate = "";
try {
  // just incase it is not defined, want the app to still work
  version = __APP_VERSION__;
  buildDate = __BUILD_DATE__;
  // eslint-disable-next-line no-console
  console.log("App Version: " + version);
} catch (e) {
  console.error("__APP_VERSION__ is not defined", e);
}
export const appVersion = version;
export const appVersionBuild = version + (buildDate ? "-" + buildDate : "");
export const appId = "CORTEXCHAT";
export const appConfigId = {
  appId: "",
};

export type SupportLink = {
  name: string;
  href: string;
};
export type SupportLinks = {
  title?: string;
  links?: SupportLink[];
};
export interface MessageWithTokens extends InferenceMessage {
  tokens: number;
  excluded?: boolean;
}
export type ChatHistoryEntry = {
  key: string;
  question: string;
  timestamp: number;
  history?: MessageWithTokens[];
  docs?: CortexSearchResultRow[];
  usage?: CortexInferenceUsage;
  favorite?: boolean;
};

export interface AppConfig {
  appId?: string;
  appTitle?: string;
  appInfo?: string;
  /** information about which search service to use */
  cortexSearchService?: {
    db: string;
    schema: string;
    service: string;
    limit?: number;
    asApi?: boolean;
  };
  /** information about which columns in a search service to use */
  cortexSearchDocuments?: {
    nameField: string;
    contentField: string;
    urlField?: string;
    /** how to display the resulting documnts
     * - unique: one item per document instead of per chunk
     * - none: do not display documents
     */
    display?: "unique" | "none";
    /** if true, do not show chunk text for found documents */
    noChunkText?: boolean;
    /** if true, attempts to format the name with splits and capitalization */
    formatName?: boolean;
  };
  // need to define
  cortexSearchFilters?: unknown;
  supportLinks?: SupportLinks;
  model?: string;
  chatAsApi?: boolean;
  /** true if the search has filtering options */
  hasOptions?: boolean;
}

/** an optional additional filter for cortex search */
export interface AppConfigOption {
  appId?: string;
  /** relative display order for the option */
  displayOrder?: number;
  /** name (label) for the option as well as an id for it.
   * must be unique among options for the app id
   */
  optionName?: string;
  /** this is the name of the column in the cortex search service for the filter */
  dbName?: string;
  /** if tableId and valueField provided, this is a table from which to get a list of values */
  tableId?: string;
  /** if tableId and valueField provided, this is a column from which to get a list of values */
  valueField?: string;
  /** if tableId and valueField provided, this is a column from which to get an alternate display name for the associated value */
  labelField?: string;
  /** JSON array of values to use instead of querying a lookup table.
   * if given, tableId, valueField, labelField are ignored.
   * should be JSONified DropdownOption[], [{value: string, label?: string}]
   */
  lookupValues?: string;
  /** data type of dbName column, related to CortexSearchOp. defaults to "string". */
  dbType?: "string" | "array";
  isLanguage?: boolean;
  isMulti?: boolean;
}

export const testConfigs: Record<string, AppConfig> = {
  HR_AI: {
    appId: "SNOWFLAKE_DOCS",
    appTitle: "Snowflake Documentation Q&A",
    appInfo: "Ask Questions and Get Answers from the Snowflake Documenation",
    cortexSearchService: {
      db: "SNOWFLAKE_DOCUMENTATION",
      schema: "SHARED",
      service: "CKE_SNOWFLAKE_DOCS_SERVICE",
      limit: 4,
      asApi: true,
    },
    cortexSearchDocuments: {
      nameField: "DOCUMENT_TITLE",
      contentField: "CHUNK",
      urlField: "SOURCE_URL",
      display: "unique",
      noChunkText: true,
      formatName: true,
    },
    supportLinks: {
      title: "For more information",
      links: [
        {
          name: "Snowflake Documentation",
          href: "https://docs.snowflake.com/",
        },
      ],
    },
    chatAsApi: true,
  },
  CHAT_ONLY: {
    appId: "CHAT_ONLY",
    appTitle: "Generic LLM Chat",
    appInfo: "Simple Cortex Chat UI",
    chatAsApi: true,
  },
};

export const testOptions: Record<string, AppConfigOption[]> = {};
