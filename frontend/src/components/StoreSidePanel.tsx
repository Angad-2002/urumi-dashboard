import { Store } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { StoreOverviewTab } from "./StoreOverviewTab";
import { StoreResourcesTab } from "./StoreResourcesTab";
import { StoreEventsTab } from "./StoreEventsTab";
import { StoreConfigTab } from "./StoreConfigTab";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, X, ShoppingCart, Box, RefreshCw, Copy, AlertTriangle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  store: Store | null;
  isLive?: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

const tabs = ["Overview", "Resources", "Events", "Config"] as const;
type Tab = (typeof tabs)[number];

export function StoreSidePanel({ store, isLive, onClose, onDelete, onRetry }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const { toast } = useToast();

  return (
    <AnimatePresence>
      {store && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-background sm:w-[55%]"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground">{store.name}</h2>
                  <StatusBadge status={store.status} />
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Circle className="h-1.5 w-1.5 fill-current animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {store.engine === "woocommerce" ? <ShoppingCart className="h-3 w-3" /> : <Box className="h-3 w-3" />}
                    {store.engine === "woocommerce" ? "WooCommerce" : "MedusaJS"}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">{store.namespace}</span>
                  <span>{format(new Date(store.createdAt), "MMM d, yyyy HH:mm")}</span>
                </div>
                {store.url && store.status === "ready" && (
                  <a
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {store.url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1">
                {store.status === "failed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRetry(store.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(store.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error block */}
            {store.status === "failed" && store.errorMessage && (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-destructive">Provisioning Failed</p>
                  <p className="font-mono text-xs text-destructive/80">{store.errorMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive/60 hover:text-destructive"
                  onClick={() => {
                    navigator.clipboard.writeText(store.errorMessage!);
                    toast({ title: "Copied", description: "Error message copied to clipboard." });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border px-6 mt-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-3 py-2.5 text-xs font-medium transition-colors",
                    activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="panel-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
              {activeTab === "Overview" && <StoreOverviewTab store={store} />}
              {activeTab === "Resources" && <StoreResourcesTab store={store} />}
              {activeTab === "Events" && <StoreEventsTab store={store} />}
              {activeTab === "Config" && <StoreConfigTab store={store} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
