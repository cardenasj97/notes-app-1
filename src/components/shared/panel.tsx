import { cn } from "@/lib/utils";

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
};

export function Panel({ className, inset = false, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "grain relative overflow-hidden rounded-[1.75rem] border border-border bg-panel p-5 shadow-(--shadow) backdrop-blur-xl",
        inset && "bg-panel-strong",
        className,
      )}
      {...props}
    />
  );
}
