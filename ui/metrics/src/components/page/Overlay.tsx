import useAppState from "@/context/useAppState";
import { useCallback, useRef } from "react";
import { IoClose } from "react-icons/io5";

// time between mouse down and mouse up for a click to close dialog
const clickCloseTime = 1000;

export default function Overlay() {
  const [{ overlay }, dispatch] = useAppState();
  const bgClickStart = useRef<number>(0);

  const close = useCallback(() => {
    dispatch({ type: "setOverlay", payload: undefined });
  }, [dispatch]);

  if (!overlay) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      className="fixed top-0 right-0 z-50 h-full w-full bg-neutral-700/70"
      onMouseUp={() => {
        // standard click event caused inconvenience is mouse moved in/out of dialog during click
        // so just tracking down/up provides better experience
        if (bgClickStart.current) {
          if (bgClickStart.current > new Date().valueOf() - clickCloseTime) {
            close();
          }
        }
      }}
      onMouseDown={() => {
        bgClickStart.current = new Date().valueOf();
      }}
    >
      <div
        role="dialog"
        className={`absolute top-[10%] left-[10%] flex h-4/5 w-4/5 flex-col flex-nowrap overflow-auto overscroll-contain rounded-lg bg-white p-4 dark:bg-zinc-900`}
        onClick={(e) => {
          // prevent clicks from falling through to dialog
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // prevent clicks from falling through to dialog
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          // prevent clicks from falling through to dialog
          e.stopPropagation();
        }}
      >
        {overlay}
      </div>
      <div className="absolute top-[10%] right-[10%]">
        <button
          type="button"
          title="Close"
          className="absolute -top-8 -right-8 cursor-pointer rounded-full bg-white p-2 text-4xl text-neutral-800 hover:text-fuchsia-500 dark:bg-zinc-900 dark:text-neutral-200"
          onClick={() => {
            close();
          }}
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}
