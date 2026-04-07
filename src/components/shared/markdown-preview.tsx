import ReactMarkdown from "react-markdown";

type MarkdownPreviewProps = {
  value: string;
  className?: string;
};

export function MarkdownPreview({ value, className }: MarkdownPreviewProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="prose-markdown text-sm leading-7">{children}</p>,
        }}
      >
        {value || "_No content yet._"}
      </ReactMarkdown>
    </div>
  );
}
