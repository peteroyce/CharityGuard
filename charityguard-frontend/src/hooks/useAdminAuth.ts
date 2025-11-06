import { useState } from "react";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(!!localStorage.getItem("isAdmin"));

  function login(password: string): boolean {
    // ✅ FIXED: Changed to admin123
    if (password === "admin123") {
      localStorage.setItem("isAdmin", "true");
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem("isAdmin");
    setIsAdmin(false);
  }

  return { isAdmin, login, logout };
}