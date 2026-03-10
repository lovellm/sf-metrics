import { memo } from "react";
import { PiChatDots, PiSpinnerGap } from "react-icons/pi";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";

interface ChatHistoryItemProps {
  role: string;
  content: string;
  isPartial?: boolean;
  isPending?: boolean;
}

function ChatHistoryItem_({ role, content, isPartial, isPending }: ChatHistoryItemProps) {
  return (
    <div
      className={
        "border-main w-11/12 rounded-lg border px-2 py-1 wrap-break-word " +
        (role === "user"
          ? " bg-accent-extraLight dark:bg-accent-dark self-end"
          : " bg-accent-light dark:bg-primary-dark") +
        (isPartial || isPending ? " opacity-60" : "")
      }
    >
      {isPartial && (
        <div>
          {content}
          <PiChatDots className="inline-block animate-bounce" />
        </div>
      )}
      {isPending && !isPartial && (
        <div>
          <PiSpinnerGap className="animate-spin text-xl" />
        </div>
      )}
      {!isPartial && !isPending && (
        <div className="markdown">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [rehypeExternalLinks, { target: "_blank", rel: "noreferrer noopener" }],
            ]}
          >
            {content}
          </Markdown>
        </div>
      )}
    </div>
  );
}

const ChatHistoryItem = memo(ChatHistoryItem_);
export default ChatHistoryItem;
