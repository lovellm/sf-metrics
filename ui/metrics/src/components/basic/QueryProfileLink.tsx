interface QueryProfileLinkProps {
  text?: string;
  queryId?: string;
}

const getQueryProfileUrl = (x: string) =>
  `https://app.snowflake.com/{org}}/{account}/#/compute/history/queries/${x}/detail`;

/** returns a link to the Snowflake query profile page for the given query id */
export default function QueryProfileLink({ text, queryId = "" }: QueryProfileLinkProps) {
  const link = getQueryProfileUrl(queryId || "");
  return (
    <a href={getQueryProfileUrl(queryId || "")} target="_blank" className="a-main">
      {text || link}
    </a>
  );
}
