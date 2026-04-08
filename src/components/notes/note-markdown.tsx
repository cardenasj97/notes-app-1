import ReactMarkdown from "react-markdown";

type NoteMarkdownProps = {
  body: string;
};

export function NoteMarkdown({ body }: NoteMarkdownProps) {
  return (
    <div className="prose prose-zinc max-w-none text-zinc-800 prose-headings:font-semibold prose-headings:text-zinc-950 prose-p:text-zinc-800 prose-a:text-sky-700">
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
