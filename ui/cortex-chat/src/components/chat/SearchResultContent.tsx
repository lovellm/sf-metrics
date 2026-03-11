interface SearchResultContentProps {
  name: string;
  url?: string;
  content?: string;
}
export default function SearchResultContent({ name, url, content }: SearchResultContentProps) {
  return (
    <div className="overflow-auto p-2">
      <div className="text-xl font-bold">
        {url ? (
          <a href={url} className="a-main" target="_blank" rel="noreferrer">
            {name}
          </a>
        ) : (
          <span>{name}</span>
        )}
      </div>
      <div className="my-2">
        Below is the content of the document as it was provided to the LLM. Please note that this is
        the plain text only, it does not contain any formatting.
        {url && <span> Click on the name of the document to see the original.</span>}
      </div>
      <div className="border-main my-2 rounded border bg-stone-200 p-2 dark:bg-stone-900">
        {content}
      </div>
    </div>
  );
}
