import ReactMarkdown from "react-markdown";

type NoteMarkdownProps = {
  body: string;
};

export function NoteMarkdown({ body }: NoteMarkdownProps) {
  return (
    <div className="prose prose-zinc max-w-none prose-headings:font-semibold prose-a:text-sky-700">
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
