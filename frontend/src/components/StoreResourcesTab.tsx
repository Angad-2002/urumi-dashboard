import { Store } from "@/lib/types";
import { StatusBadge as SB } from "./StatusBadge";

const kindColors: Record<string, string> = {
  Deployment: "text-primary",
  StatefulSet: "text-[hsl(var(--warning))]",
  Service: "text-[hsl(var(--success))]",
  Ingress: "text-foreground",
  PVC: "text-muted-foreground",
  Secret: "text-muted-foreground",
};

const statusColors: Record<string, string> = {
  Running: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",
  Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20",
  Error: "bg-destructive/15 text-destructive border-destructive/20",
  Bound: "bg-primary/15 text-primary border-primary/20",
  Active: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",
};

export function StoreResourcesTab({ store }: { store: Store }) {
  const resources = store.resources ?? [];

  if (resources.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No resources provisioned yet.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-4 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Kind</span>
        <span>Name</span>
        <span>Replicas</span>
        <span>Status</span>
      </div>
      {resources.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-x-4 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent/50">
          <span className={`font-medium ${kindColors[r.kind] ?? "text-foreground"}`}>{r.kind}</span>
          <span className="font-mono text-xs text-foreground">{r.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{r.replicas ?? "—"}</span>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[r.status] ?? ""}`}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
