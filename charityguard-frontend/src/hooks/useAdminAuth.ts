import { useState } from "react";

// Module-level variable: access token lives in memory only (not localStorage)
let _accessToken: string | null = null;

function getAccessToken(): string | null {
  return _accessToken;
}

function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(!!localStorage.getItem("refreshToken"));

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.accessToken && data.refreshToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        const adminStatus = data.user?.role === "admin";
        setIsAdmin(adminStatus);
        return adminStatus;
      }

      return false;
    } catch {
      return false;
    }
  }

  async function logout(): Promise<void> {
    const token = getAccessToken();
    try {
      if (token) {
        await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(10000),
        });
      }
    } catch {
      // Non-critical: clear state regardless
    } finally {
      setAccessToken(null);
      localStorage.removeItem("refreshToken");
      setIsAdmin(false);
    }
  }

  return { isAdmin, login, logout, getAccessToken };
}
