import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  signIn: (email: string) => void;
  signUp: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (email: string) => {
    setUser({ id: `user-${email.replace(/[^a-z0-9]/gi, "")}`, email });
  };

  const signUp = (email: string) => {
    setUser({ id: `user-${email.replace(/[^a-z0-9]/gi, "")}`, email });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
