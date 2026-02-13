import { Store } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, XCircle, Cpu, HardDrive, Database } from "lucide-react";

const DEFAULT_STEPS = [
  { label: "Namespace created", completed: false },
  { label: "Secrets generated", completed: false },
  { label: "Database ready", completed: false },
  { label: "App deployed", completed: false },
  { label: "Ingress ready", completed: false },
];

export function StoreOverviewTab({ store }: { store: Store }) {
  const steps =
    store.provisioningSteps?.length
      ? store.provisioningSteps
      : DEFAULT_STEPS.map((s) => ({
          ...s,
          completed: store.status === "ready",
        }));
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  const parseUsage = (used: string, limit: string) => {
    const u = parseFloat(used);
    const l = parseFloat(limit);
    return l > 0 ? (u / l) * 100 : 0;
  };

  const quotas = store.quotas ?? {
    cpuUsed: "0m",
    cpuLimit: "500m",
    memUsed: "0Mi",
    memLimit: "512Mi",
    pvcUsed: "0Gi",
    pvcLimit: "5Gi",
  };

  return (
    <div className="space-y-6">
      {/* Provisioning Progress */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Provisioning Progress
        </h4>
        <Progress value={progress} className="h-1.5 bg-secondary" />
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {step.error ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              ) : step.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
              <span
                className={
                  step.error
                    ? "text-destructive"
                    : step.completed
                      ? "text-foreground"
                      : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Grid: Engine Version, Replicas, Pod Restarts, Pods Running */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Engine Version" value={store.engineVersion ?? "—"} />
        <InfoCard
          label="Replicas"
          value={`${store.podsRunning ?? 0} / ${store.replicas ?? 0}`}
        />
        <InfoCard label="Pod Restarts" value={String(store.podRestarts ?? 0)} />
        <InfoCard label="Pods Running" value={String(store.podsRunning ?? 0)} />
      </div>

      {/* Resource Usage */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Resource Usage
        </h4>
        <UsageBar
          icon={Cpu}
          label="CPU"
          used={quotas.cpuUsed}
          limit={quotas.cpuLimit}
          pct={parseUsage(quotas.cpuUsed, quotas.cpuLimit)}
        />
        <UsageBar
          icon={HardDrive}
          label="Memory"
          used={quotas.memUsed}
          limit={quotas.memLimit}
          pct={parseUsage(quotas.memUsed, quotas.memLimit)}
        />
        <UsageBar
          icon={Database}
          label="PVC"
          used={quotas.pvcUsed}
          limit={quotas.pvcLimit}
          pct={parseUsage(quotas.pvcUsed, quotas.pvcLimit)}
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function UsageBar({ icon: Icon, label, used, limit, pct }: { icon: React.ElementType; label: string; used: string; limit: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-mono text-foreground">
          {used} <span className="text-muted-foreground">/ {limit}</span>
        </span>
      </div>
      <Progress value={pct} className="h-1 bg-secondary" />
    </div>
  );
}
