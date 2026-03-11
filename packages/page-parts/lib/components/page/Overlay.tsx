import { useCallback, useRef } from "react";
import { IoClose } from "react-icons/io5";
import usePageState from "../../context/usePageState";

// time between mouse down and mouse up for a click to close dialog
const clickCloseTime = 1000;

export default function Overlay() {
  const [{ overlay }, dispatch] = usePageState();
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
      className="bg-primary-dark/70 fixed top-0 right-0 z-50 h-full w-full"
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
          className="text-accent-link hover:text-accent-medium dark:text-accent-light absolute -top-8 -right-8 cursor-pointer rounded-full bg-white p-2 text-4xl dark:bg-zinc-900"
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
