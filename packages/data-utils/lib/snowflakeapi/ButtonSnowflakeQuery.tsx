import { useRef, useState } from "react";
import { PiSpinnerGap } from "react-icons/pi";
import SnowflakeApiRequest, {
  RunQueryResult,
  SnowflakeApiRequestOptions,
  SnowflakeBindings,
} from "./SnowflakeApiRequest";
import asyncTimeout from "../utils/asyncTimeout";
import getSnowflakeSql from "./getSnowflakeSql";
import { Query } from "../dataApi";

export interface ButtonSnowflakeQueryProps {
  /** sql string to run */
  sql?: string;
  /** if no sql string given, one will attempt to be created from this */
  query?: Query;
  /** after the query is done, this will be called */
  onDone?: (result: RunQueryResult) => void;
  /** if the query gives an error, this will be called */
  onError?: (error: unknown) => void;
  /** if sql given that contains ? binds, these are the bind values to pass for those */
  bindings?: SnowflakeBindings;
  /** options for the api request. only the values present when button is first clicked will be used.
   * any changes after the first click are ignored.
   */
  options?: SnowflakeApiRequestOptions;
  children?: React.ReactNode;
  className?: string;
  /** text to display while running query */
  statusExecuting?: string;
  statusRetrieving?: string;
  /** expected to be an icon from react-icons */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function ButtonSnowflakeQuery({
  sql,
  query,
  bindings,
  onDone,
  onError,
  options,
  className,
  icon,
  children,
  statusExecuting,
  statusRetrieving,
  disabled,
}: ButtonSnowflakeQueryProps) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const apiRequest = useRef<SnowflakeApiRequest | null>(null);

  const noClick = disabled || (!sql && !query);

  return (
    <button
      type="button"
      className={className || "flex items-center gap-x-2"}
      disabled={noClick || isPending}
      onClick={() => {
        // no sql, do nothing
        if (noClick) {
          return;
        }

        // request instance not made yet, make a request instance
        if (!apiRequest.current) {
          apiRequest.current = new SnowflakeApiRequest(options);
        }

        // make an async function to wrap the requests and simplify logic
        const doAction = async () => {
          setIsPending(true);
          setStatus(statusExecuting || "Running Query...");
          // return the sql if given, or generate from api if needed
          const finalSql = await getSnowflakeSql({ sql: sql, query: query });
          // no sql, do nothing
          if (!finalSql || !apiRequest.current) {
            return;
          }
          // run the query process
          const result = await apiRequest.current.runQuery(finalSql, bindings);
          if (typeof onDone === "function") {
            onDone(result);
          }
        };
        // run the query
        doAction()
          .catch((e) => {
            if (typeof onError === "function") {
              onError(e);
            } else {
              console.error("error running query in ButtonSnowflakeQuery", e);
            }
          })
          .finally(() => {
            apiRequest.current?.done();
            setIsPending(false);
          });

        // make an async function to check and update status periodically
        const checkStatus = async () => {
          // give some time to make sure query actually starts
          // if this runs before query starts, will never provide updates
          await asyncTimeout(2000);
          while (
            apiRequest.current &&
            (apiRequest.current.status === "executing" || apiRequest.current.status === "results")
          ) {
            if (apiRequest.current.status === "results") {
              const p = apiRequest.current.percent;
              setStatus((statusRetrieving || "Retrieving...") + " " + p + "%");
            }
            await asyncTimeout(500);
          }
        };
        // run the status function
        checkStatus().catch((e) => {
          console.warn("error while checking status", e);
        });
      }}
    >
      {isPending ? <PiSpinnerGap className="animate-spin" /> : icon}
      {isPending ? <span>{status}</span> : children}
    </button>
  );
}
