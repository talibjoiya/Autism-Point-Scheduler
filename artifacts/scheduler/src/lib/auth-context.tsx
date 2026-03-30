import { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const isAuthenticated = !!user && !error;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!isLoading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role || "")) {
      // Redirect based on role if unauthorized
      if (user?.role === "admin") setLocation("/dashboard");
      else setLocation("/timeslots");
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;
  }

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role || ""))) {
    return null;
  }

  return <>{children}</>;
}
