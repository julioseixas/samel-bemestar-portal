import { useEffect, useRef } from "react";
import { getAuthFromCookies, renewAuthCookies, hasValidCookieSession } from "@/lib/cookie-storage";

/**
 * Componente invisível que restaura a sessão do usuário a partir dos cookies
 * e implementa sliding expiration (renova expiração a cada abertura do app)
 * 
 * Fluxo:
 * 1. Verifica se localStorage tem dados de sessão
 * 2. Se não tiver, tenta restaurar dos cookies
 * 3. Renova a expiração dos cookies para +30 dias (sliding expiration)
 */
export const SessionRestorer = () => {
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // Evita execução duplicada em Strict Mode
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreSession = () => {
      try {
        // Verifica se já existe sessão no localStorage
        const existingToken = localStorage.getItem("user");
        
        if (existingToken) {
          renewAuthCookies();
          return;
        }
        
        if (!hasValidCookieSession()) {
          return;
        }
        
        const authData = getAuthFromCookies();
        
        if (!authData) {
          return;
        }
        
        localStorage.setItem("user", authData.token);
        localStorage.setItem("titular", JSON.stringify(authData.titular));
        localStorage.setItem("patientData", JSON.stringify(authData.patientData));
        localStorage.setItem("listToSchedule", JSON.stringify(authData.listToSchedule));
        localStorage.setItem("rating", authData.rating);
        
        renewAuthCookies();
        
        // Força reload para aplicar a sessão restaurada
        // Apenas se estamos na página de login
        if (window.location.pathname === "/" || window.location.pathname === "/login") {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        // Error restoring session
      }
    };

    restoreSession();
  }, []);

  // Componente invisível - não renderiza nada
  return null;
};
