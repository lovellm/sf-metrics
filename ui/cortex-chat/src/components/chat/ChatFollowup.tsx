import { useState } from "react";
import { IoContract, IoExpand } from "react-icons/io5";
import { PiSpinnerGap } from "react-icons/pi";

interface ChatFollowupProps {
  onSubmit?: (question: string) => void;
  isPending?: boolean;
}

export const MAX_FOLLOWUP_LENGTH = 1000;
const PLACEHOLDER_TEXT = "Ask a follow up within the context of the existing chat";

export default function ChatFollowup({ onSubmit, isPending }: ChatFollowupProps) {
  const [question, setQuestion] = useState<string>("");
  const [multiline, setMultiline] = useState<boolean>(false);

  const handleSubmit = () => {
    if (typeof onSubmit === "function") {
      onSubmit(question);
      setQuestion("");
    }
  };

  const isDisabled = isPending || question.length < 3;

  return (
    <div className="mt-2 grid grid-cols-1 text-center">
      <div className="flex w-full gap-x-2">
        {multiline ? (
          <textarea
            rows={3}
            name="chat-question"
            className="input-main w-full grow rounded-xl border px-2 py-1"
            placeholder={PLACEHOLDER_TEXT}
            maxLength={MAX_FOLLOWUP_LENGTH}
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
            maxLength={MAX_FOLLOWUP_LENGTH}
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
        <div className="flex shrink-0 items-center self-stretch">
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
        <div className="flex shrink-0 items-center self-stretch">
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
              <span>Follow up</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
