import { cn } from "@/lib/utils";

type TagProps = React.HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-panel-strong px-3 py-1 text-xs font-medium text-foreground-muted",
        className,
      )}
      {...props}
    />
  );
}
