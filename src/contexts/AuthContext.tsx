import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Role } from "@/data/mockData";

interface User {
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  selectedRole: Role | null;
  setSelectedRole: (role: Role) => void;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string, name: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("operis_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const login = (email: string, _password: string) => {
    if (!selectedRole) return false;
    const u = { email, name: email.split("@")[0], role: selectedRole };
    setUser(u);
    localStorage.setItem("operis_user", JSON.stringify(u));
    return true;
  };

  const signup = (email: string, _password: string, name: string) => {
    if (!selectedRole) return false;
    const u = { email, name, role: selectedRole };
    setUser(u);
    localStorage.setItem("operis_user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    setSelectedRole(null);
    localStorage.removeItem("operis_user");
  };

  return (
    <AuthContext.Provider value={{ user, selectedRole, setSelectedRole, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
