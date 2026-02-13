import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuth: (email: string) => void;
}

export function AuthDialog({ open, onOpenChange, onAuth }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValid = email.trim().includes("@") && password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onAuth(email.trim());
    setEmail("");
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your stores." : "Create an account to start provisioning stores."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-sm text-muted-foreground">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="text-sm text-muted-foreground">Password</Label>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-secondary pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {mode === "signup" && password.length > 0 && password.length < 6 && (
              <p className="text-[11px] text-destructive">Password must be at least 6 characters</p>
            )}
          </div>
          <Button type="submit" disabled={!isValid} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? "No account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setPassword(""); }}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
