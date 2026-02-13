import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface Props {
  storeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ storeName, open, onOpenChange, onConfirm }: Props) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    if (confirmText === storeName) {
      onConfirm();
      setConfirmText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setConfirmText(""); }}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Store "{storeName}"?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This action is irreversible. The following resources will be permanently deleted:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <ul className="space-y-1.5 rounded-md border border-border bg-secondary/50 px-4 py-3 text-xs text-foreground">
            <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-destructive" /> Namespace and all workloads</li>
            <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-destructive" /> Persistent volumes and data</li>
            <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-destructive" /> Secrets and configurations</li>
            <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-destructive" /> Ingress and DNS records</li>
          </ul>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{storeName}</span> to confirm deletion:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={storeName}
              className="border-border bg-secondary font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-destructive"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              disabled={confirmText !== storeName}
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
            >
              Delete Store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
