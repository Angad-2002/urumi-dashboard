import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { StoreEngine, StoreStatus } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type SortOption = "newest" | "oldest" | "name" | "status";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StoreStatus[];
  onStatusFilterChange: (v: StoreStatus[]) => void;
  engineFilter: StoreEngine[];
  onEngineFilterChange: (v: StoreEngine[]) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}

const statusOptions: StoreStatus[] = ["ready", "provisioning", "failed"];
const engineOptions: StoreEngine[] = ["woocommerce", "medusa"];
const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "status", label: "Status" },
];

export function SearchAndFilterBar({
  search, onSearchChange,
  statusFilter, onStatusFilterChange,
  engineFilter, onEngineFilterChange,
  sort, onSortChange,
}: Props) {
  const toggleStatus = (s: StoreStatus) => {
    onStatusFilterChange(
      statusFilter.includes(s) ? statusFilter.filter((x) => x !== s) : [...statusFilter, s]
    );
  };
  const toggleEngine = (e: StoreEngine) => {
    onEngineFilterChange(
      engineFilter.includes(e) ? engineFilter.filter((x) => x !== e) : [...engineFilter, e]
    );
  };

  const activeFilters = statusFilter.length + engineFilter.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search stores..."
          className="h-8 border-border bg-secondary pl-9 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      {/* Filters */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border text-xs text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-border bg-card">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
          {statusOptions.map((s) => (
            <DropdownMenuCheckboxItem key={s} checked={statusFilter.includes(s)} onCheckedChange={() => toggleStatus(s)} className="text-xs capitalize text-foreground">
              {s}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Engine</DropdownMenuLabel>
          {engineOptions.map((e) => (
            <DropdownMenuCheckboxItem key={e} checked={engineFilter.includes(e)} onCheckedChange={() => toggleEngine(e)} className="text-xs text-foreground">
              {e === "woocommerce" ? "WooCommerce" : "MedusaJS"}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border text-xs text-muted-foreground hover:text-foreground">
            <ArrowUpDown className="h-3 w-3" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 border-border bg-card">
          {sortOptions.map((o) => (
            <DropdownMenuCheckboxItem key={o.value} checked={sort === o.value} onCheckedChange={() => onSortChange(o.value)} className="text-xs text-foreground">
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
