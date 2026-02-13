import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreEngine } from "@/lib/types";
import { ShoppingCart, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, engine: StoreEngine) => void;
}

export function CreateStoreDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("");
  const [engine, setEngine] = useState<StoreEngine>("woocommerce");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), engine);
    setName("");
    setEngine("woocommerce");
    onOpenChange(false);
  };

  const engines: { value: StoreEngine; label: string; desc: string; icon: React.ElementType }[] = [
    { value: "woocommerce", label: "WooCommerce", desc: "WordPress + WooCommerce", icon: ShoppingCart },
    { value: "medusa", label: "MedusaJS", desc: "Headless commerce engine", icon: Box },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Store</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Provision a new ecommerce store on your cluster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="store-name" className="text-sm text-muted-foreground">Store Name</Label>
            <Input
              id="store-name"
              placeholder="My Awesome Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Engine</Label>
            <div className="grid grid-cols-2 gap-3">
              {engines.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEngine(e.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                    engine === e.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-secondary hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <e.icon className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">{e.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Store
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
