import { MessageWithTokens } from "@/constants";
import ChatHistoryItem from "./ChatHistoryItem";

interface ChatHistoryProps {
  history?: MessageWithTokens[];
  partialContent?: string;
  isPending?: boolean;
}

export default function ChatHistory({ history, partialContent, isPending }: ChatHistoryProps) {
  if (!history || !history.length) {
    return undefined;
  }

  return (
    <div className="flex flex-col gap-y-2">
      {history.map((item, i) => {
        return <ChatHistoryItem key={i} role={item.role} content={item.content} />;
      })}
      {partialContent && <ChatHistoryItem role="assistant" content={partialContent} isPartial />}
      {isPending && !partialContent && <ChatHistoryItem role="assistant" content="" isPending />}
    </div>
  );
}
