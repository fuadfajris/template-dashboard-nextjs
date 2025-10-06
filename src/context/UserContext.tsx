"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  logo?: string | null;
  logo_path?: string | null;
  token?: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse user from sessionStorage", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
};
