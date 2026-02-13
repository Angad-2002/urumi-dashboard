import { Store } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Trash2, Clock, Server, ShoppingCart, Box, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Props {
  store: Store;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: () => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

export function StoreRow({ store, selected, onSelect, onClick, onDelete, onRetry }: Props) {
  const EngineIcon = store.engine === "woocommerce" ? ShoppingCart : Box;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors duration-150 hover:bg-accent/50 cursor-pointer"
      onClick={onClick}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(store.id)}
          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
        <EngineIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-sm font-medium text-foreground">{store.name}</span>
          <StatusBadge status={store.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Server className="h-3 w-3" />
            {store.engine === "woocommerce" ? "WooCommerce" : "MedusaJS"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(store.createdAt), { addSuffix: true })}
          </span>
          <span className="hidden font-mono text-[10px] text-muted-foreground/60 sm:inline">
            {store.namespace}
          </span>
        </div>
        {store.status === "failed" && store.errorMessage && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span className="truncate">Failed – {store.errorMessage}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {store.status === "failed" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRetry(store.id)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
        {store.url && store.status === "ready" && (
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <a href={store.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(store.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
