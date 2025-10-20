export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** if true, running locally */
      IS_LOCAL?: string;
      /** port number to run the server on */
      PORT?: string;
      /** determines how much gets logged to standard out */
      LOG_LEVEL?: string;
      /** snowflake host - snowflake will populate */
      SNOWFLAKE_HOST: string;
      /** snowflake account identifier - snowflake will populate */
      SNOWFLAKE_ACCOUNT?: string;
      /** default database - snowflake will populate */
      SNOWFLAKE_DATABASE?: string;
      /** default schema - snowflake will populate */
      SNOWFLAKE_SCHEMA?: string;
      SNOWFLAKE_WAREHOUSE?: string;
      SNOWFLAKE_USER?: string;
      SNOWFLAKE_PK_PATH?: string;
      SNOWFLAKE_PK_PASS?: string;
      SNOWFLAKE_PK_STRING?: string;
      SNOWFLAKE_ROLE?: string;
      QUERY_TAG?: string;
      APP_NAME?: string;
    }
  }
}
