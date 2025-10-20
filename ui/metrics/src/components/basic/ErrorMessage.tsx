import { useReducer, useEffect, useRef } from "react";
import { MdClose, MdOutlineRotateRight } from "react-icons/md";
import { AxiosError } from "axios";

export interface ErrorMessageProps {
  message: string;
  error?: Error;
  /** If true, show as a loading/pending message instead of error */
  pending?: boolean;
  onClose?: () => void;
  onRetry?: () => void;
}

interface ErrorInstance {
  key: number;
  redraw: () => void;
}

// Global List of All Current Errors, from any component
let ALL_ERRORS: ErrorInstance[] = [];

// Current error key, simple incrementing counter
// Needed for maintaining global awareness
let CURRENT_KEY = 0;

// The message box height
const HEIGHT = 60;
const VPADDING = 8;

// margin between boxes
const MARGIN = 10;
const BOTTOM_MARGIN = 30;

const incrementReducer = (x: number) => x + 1;

/** An Error Message that appears until dismissed or until
 * no longer desired by its parent component
 */
export default function ErrorMessage(props: ErrorMessageProps) {
  const originalError = props.error;
  const [, forceUpdate] = useReducer(incrementReducer, 0);
  const idRef = useRef<number>(0);

  const isPending = props.pending || false;

  useEffect(() => {
    CURRENT_KEY += 1;
    idRef.current = CURRENT_KEY;

    ALL_ERRORS.push({
      key: idRef.current,
      redraw: forceUpdate,
    });

    forceUpdate();

    return () => {
      // This error message no longer needed, remove it from the global tracking list
      ALL_ERRORS = ALL_ERRORS.filter((e) => {
        if (!e) {
          return false;
        }
        return e.key !== idRef.current;
      });

      // Trigger all other instances to redraw as they might need a new position
      ALL_ERRORS.forEach((e) => {
        if (e && typeof e.redraw === "function") {
          e.redraw();
        }
      });
    };
  }, []);

  const errorMessage = messageFromError(originalError);

  let position = -1;
  ALL_ERRORS.forEach((e, i) => {
    if (e && e.key === idRef.current) {
      position = i;
    }
  });

  if (position < 0) {
    // Potentially first render before effect happens, or caused by Strict Mode double rendering
    return null;
  }
  // the 2 * VPADDING would be needed with content-box but not border-box
  const bottom = BOTTOM_MARGIN + position * HEIGHT /* + 2 * VPADDING*/ + position * MARGIN;

  const bg = isPending ? " bg-blue-200 dark:bg-blue-800" : " bg-red-200 dark:bg-red-800";
  const border = isPending
    ? " border-blue-800 dark:border-blue-800"
    : " border-red-800 dark:border-red-800";
  const text = isPending ? " text-blue-800 dark:text-blue-200" : " text-red-800 dark:text-red-200";

  return (
    <div
      className={
        "fixed left-1/4 z-50 flex w-1/2 items-center rounded-2xl border text-lg " +
        bg +
        border +
        text
      }
      style={{
        bottom: bottom,
        height: HEIGHT,
        padding: `${VPADDING}px 20px`,
      }}
    >
      {props.pending && (
        <div className="m-3 flex text-3xl">
          <MdOutlineRotateRight className="animate-spin" />
        </div>
      )}
      <div className="flex-auto overflow-hidden">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          <b>{props.message || "No Message Provided"}</b>
        </div>
        {errorMessage && (
          <div className="overflow-hidden text-base text-ellipsis whitespace-nowrap">
            {errorMessage}
          </div>
        )}
      </div>
      {typeof props.onRetry === "function" && (
        <button
          type="button"
          onClick={props.onRetry}
          className="mx-3 my-0 cursor-pointer border border-black px-4 py-2 text-base"
        >
          Retry
        </button>
      )}
      {typeof props.onClose === "function" && (
        <button
          type="button"
          className="align-center flex w-fit cursor-pointer bg-inherit text-2xl text-black"
          onClick={() => {
            if (typeof props.onClose === "function") {
              props.onClose();
            }
          }}
        >
          <MdClose />
        </button>
      )}
    </div>
  );
}

/** given a possible Error object or string, return the appropriate message from it */
function messageFromError(error?: Error | string): string | undefined {
  if (!error) {
    return undefined;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK") {
      if (navigator.onLine) {
        return "Generic Network Error";
      }
      return "Network Error";
    }
    if (error.response?.status === 401) {
      return "Unauthorized";
    }
    const responseData = error.response?.data as Record<string, string> | undefined;
    let responseMessage = "";
    if (responseData && "message" in responseData) {
      responseMessage = responseData.message;
    }
    return (error.response?.status || error.code) + " - " + (responseMessage || error.message);
  }

  return error.message;
}
