import { Store, StoreStatus } from "@/lib/types";
import { Box, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  stores: Store[];
  activeFilter: StoreStatus | null;
  onFilterClick: (status: StoreStatus | null) => void;
}

export function StatsBar({ stores, activeFilter, onFilterClick }: Props) {
  const total = stores.length;
  const ready = stores.filter((s) => s.status === "ready").length;
  const provisioning = stores.filter((s) => s.status === "provisioning").length;
  const failed = stores.filter((s) => s.status === "failed").length;

  const stats = [
    { label: "Total", value: total, icon: Box, color: "text-foreground", filter: null as StoreStatus | null },
    { label: "Ready", value: ready, icon: CheckCircle2, color: "text-[hsl(var(--success))]", filter: "ready" as StoreStatus },
    { label: "Provisioning", value: provisioning, icon: Loader2, color: "text-[hsl(var(--warning))]", filter: "provisioning" as StoreStatus },
    { label: "Failed", value: failed, icon: XCircle, color: "text-destructive", filter: "failed" as StoreStatus },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => onFilterClick(activeFilter === s.filter ? null : s.filter)}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
            activeFilter === s.filter
              ? "border-primary bg-primary/10 ring-1 ring-primary"
              : "border-border bg-card hover:bg-accent/50"
          )}
        >
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <div>
            <p className="text-lg font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
