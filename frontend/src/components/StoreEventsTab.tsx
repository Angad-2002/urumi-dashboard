import { Store } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StoreEventsTab({ store }: { store: Store }) {
  const events = store.events ?? [];

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No events recorded.</p>;
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[5.5px] top-2 bottom-2 w-px bg-border" />
      {events.map((e, i) => (
        <div key={i} className="relative flex items-start gap-3 py-2 pl-5">
          {/* Dot */}
          <div
            className={cn(
              "absolute left-0.5 top-3 h-2.5 w-2.5 rounded-full border-2",
              e.type === "Error"
                ? "border-destructive bg-destructive"
                : e.type === "Warning"
                ? "border-[hsl(var(--warning))] bg-[hsl(var(--warning))]"
                : "border-border bg-muted-foreground/30"
            )}
          />
          <div className="flex flex-1 items-start gap-3">
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground pt-0.5">{e.timestamp}</span>
            <span
              className={cn(
                "text-xs leading-relaxed",
                e.type === "Error" ? "text-destructive" : "text-foreground"
              )}
            >
              {e.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
