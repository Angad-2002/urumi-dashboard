import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  storeCount: number;
  maxStores: number;
}

export function ProfilePopover({ storeCount, maxStores }: Props) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
            {initials}
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-border bg-card p-0"
        sideOffset={8}
      >
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.email.split("@")[0]}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Store Quota
            </span>
            <span className="text-xs font-mono text-foreground">
              {storeCount}/{maxStores}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min((storeCount / maxStores) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { signOut(); setOpen(false); }}
            className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
