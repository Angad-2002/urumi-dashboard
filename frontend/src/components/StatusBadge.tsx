import { StoreStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";

const config: Record<StoreStatus, { label: string; className: string; icon: React.ElementType }> = {
  provisioning: {
    label: "Provisioning",
    className: "bg-warning/15 text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]/20",
    icon: Loader2,
  },
  ready: {
    label: "Ready",
    className: "bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/15 text-destructive border-destructive/20",
    icon: XCircle,
  },
  deleting: {
    label: "Deleting",
    className: "bg-muted text-muted-foreground border-border",
    icon: Trash2,
  },
};

export function StatusBadge({ status }: { status: StoreStatus }) {
  const { label, className, icon: Icon } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
      <Icon className={cn("h-3 w-3", status === "provisioning" && "animate-spin")} />
      {label}
    </span>
  );
}
