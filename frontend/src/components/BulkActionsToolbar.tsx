import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, X, CheckSquare, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  count: number;
  pageCount: number;
  totalCount: number;
  hasFailedInSelection: boolean;
  failedInPageCount: number;
  failedTotalCount: number;
  onDeleteSelected: () => void;
  onRetryFailed: () => void;
  onClearSelection: () => void;
  onSelectAllInPage: () => void;
  onSelectAllAcrossPages: () => void;
  onRetryAllInPage: () => void;
  onRetryAllAcrossPages: () => void;
}

export function BulkActionsToolbar({
  count,
  pageCount,
  totalCount,
  hasFailedInSelection,
  failedInPageCount,
  failedTotalCount,
  onDeleteSelected,
  onRetryFailed,
  onClearSelection,
  onSelectAllInPage,
  onSelectAllAcrossPages,
  onRetryAllInPage,
  onRetryAllAcrossPages,
}: Props) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2"
    >
      <span className="text-xs font-medium text-foreground">{count} selected</span>

      {/* Select actions */}
      <div className="mx-1 h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckSquare className="h-3 w-3" />
            Select
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 border-border bg-card">
          <DropdownMenuItem onClick={onSelectAllInPage} className="gap-2 text-xs text-foreground">
            <CheckSquare className="h-3 w-3 text-muted-foreground" />
            Select all in this page ({pageCount})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectAllAcrossPages} className="gap-2 text-xs text-foreground">
            <CheckCheck className="h-3 w-3 text-muted-foreground" />
            Select all {totalCount} stores
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={onClearSelection} className="gap-2 text-xs text-foreground">
            <X className="h-3 w-3 text-muted-foreground" />
            Clear selection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Retry actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasFailedInSelection && failedInPageCount === 0 && failedTotalCount === 0}
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 border-border bg-card">
          <DropdownMenuItem
            onClick={onRetryFailed}
            disabled={!hasFailedInSelection}
            className="gap-2 text-xs text-foreground disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            Retry selected failed stores
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            onClick={onRetryAllInPage}
            disabled={failedInPageCount === 0}
            className="gap-2 text-xs text-foreground disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            Retry all failed in page ({failedInPageCount})
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onRetryAllAcrossPages}
            disabled={failedTotalCount === 0}
            className="gap-2 text-xs text-foreground disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            Retry all failed stores ({failedTotalCount})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeleteSelected}
        className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
        Clear
      </Button>
    </motion.div>
  );
}
