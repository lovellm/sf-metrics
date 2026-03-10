import useAppState from "@/context/useAppState";
import { DEFAULT_CONTEXT_LIMIT } from "@/data/ChatController";
import { useState } from "react";
import { IoContract, IoExpand } from "react-icons/io5";
import { PiClockCounterClockwiseBold, PiFunnel, PiSpinnerGap, PiFunnelX } from "react-icons/pi";

interface ChatInputProps {
  onSubmit?: (question: string) => void;
  isPending?: boolean;
  hasHistory?: boolean;
}

const PLACEHOLDER_TEXT = "Enter your question here";

export default function ChatInput({ onSubmit, isPending, hasHistory }: ChatInputProps) {
  const [{ appConfig, showOptions }, dispatch] = useAppState();
  const [question, setQuestion] = useState<string>("");
  const [multiline, setMultiline] = useState<boolean>(false);

  const handleSubmit = () => {
    if (typeof onSubmit === "function") {
      onSubmit(question);
      setQuestion("");
    }
  };

  const isDisabled = isPending || question.length < 3;
  const maxLength = DEFAULT_CONTEXT_LIMIT * 3;

  return (
    <div className="grid grid-cols-1 text-center">
      <div className="flex w-full flex-col items-center px-4 py-2">
        <span className="font-bold">How can I help you today?</span>
        <div className="flex w-full items-center gap-x-2">
          {/* Add a gap similar in size to resize button, but make things centered */}
          <div className="w-6"> </div>
          {multiline ? (
            <textarea
              rows={3}
              name="chat-question"
              className="input-main w-full grow rounded-xl border px-2 py-1"
              placeholder={PLACEHOLDER_TEXT}
              maxLength={maxLength}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (isDisabled) {
                  // ignore if button is disabled
                  return;
                }
                // Allow pressing ctrl+enter to submit the input
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSubmit();
                }
              }}
            />
          ) : (
            <input
              type="text"
              name="chat-question"
              className="input-main w-full grow rounded-full border px-3 py-2"
              placeholder={PLACEHOLDER_TEXT}
              maxLength={maxLength}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (isDisabled) {
                  // ignore if button is disabled
                  return;
                }
                // Allow pressing enter to submit the input
                if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
                  handleSubmit();
                }
              }}
            />
          )}
          <div className="flex items-center self-stretch">
            <button
              title={multiline ? "switch to single line input" : "switch to multi line input"}
              type="button"
              className="hover:bg-accent rounded-full p-1"
              onClick={() => {
                setMultiline((current) => !current);
              }}
            >
              {multiline ? <IoContract /> : <IoExpand />}
            </button>
          </div>
        </div>
      </div>
      <div className="relative mt-2 flex flex-row flex-wrap items-center justify-around md:justify-center">
        {appConfig?.hasOptions && (
          <button
            type="button"
            className="hover:bg-accent flex cursor-pointer items-center gap-x-2 rounded-full px-2 py-1 text-2xl md:absolute md:bottom-1 md:left-2"
            title="Question History"
            onClick={() => dispatch({ type: "setShowOptions", payload: !showOptions })}
          >
            {showOptions ? <PiFunnelX /> : <PiFunnel />}
            <span className="text-sm">{showOptions ? "Hide" : "View"} Filter Options</span>
          </button>
        )}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="btn-main flex h-10 w-60 items-center justify-center rounded-full px-2 py-2 font-bold"
            disabled={isDisabled}
            onClick={() => {
              handleSubmit();
            }}
          >
            {isPending ? (
              <PiSpinnerGap className="animate-spin text-2xl" />
            ) : (
              <span>Submit Your Question</span>
            )}
          </button>
          {hasHistory && (
            <div className="mt-2 text-sm">
              This will remove the previous answer and start a new chat.
            </div>
          )}
        </div>
        <button
          type="button"
          className="hover:bg-accent flex cursor-pointer items-center gap-x-2 rounded-full px-2 py-1 text-2xl md:absolute md:right-2 md:bottom-1"
          title="Question History"
          onClick={() => dispatch({ type: "setShowSavedHistory", payload: true })}
        >
          <PiClockCounterClockwiseBold />
          <span className="text-sm">View History</span>
        </button>
      </div>
    </div>
  );
}
