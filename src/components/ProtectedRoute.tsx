import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasValidCookieSession, getAuthFromCookies, renewAuthCookies } from "@/lib/cookie-storage";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      // 1. Tenta localStorage primeiro
      const token = localStorage.getItem("user");
      if (token) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // 2. Tenta cookies como fallback
      if (hasValidCookieSession()) {
        const authData = getAuthFromCookies();
        if (authData) {
          // Restaura no localStorage
          localStorage.setItem("user", authData.token);
          localStorage.setItem("titular", JSON.stringify(authData.titular));
          localStorage.setItem("patientData", JSON.stringify(authData.patientData));
          localStorage.setItem("listToSchedule", JSON.stringify(authData.listToSchedule));
          if (authData.rating) {
            localStorage.setItem("rating", authData.rating);
          }
          
          // Renova expiração dos cookies (sliding expiration)
          renewAuthCookies();
          
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
      }

      // 3. Sem sessão válida
      setIsAuthenticated(false);
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  // Estado de loading enquanto verifica autenticação
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Sem autenticação -> redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Autenticado -> renderiza a página
  return <>{children}</>;
};
