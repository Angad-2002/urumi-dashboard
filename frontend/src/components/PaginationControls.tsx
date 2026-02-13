import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

const pageSizes = [10, 25, 50];

export function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        {total === 0 ? "No stores" : `Showing ${start}–${end} of ${total} stores`}
      </span>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 border-border text-[10px] text-muted-foreground hover:text-foreground">
              {pageSize} / page
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-24 border-border bg-card">
            {pageSizes.map((s) => (
              <DropdownMenuCheckboxItem key={s} checked={pageSize === s} onCheckedChange={() => { onPageSizeChange(s); onPageChange(1); }} className="text-xs text-foreground">
                {s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 w-7 border-border text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[60px] text-center text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-7 w-7 border-border text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
