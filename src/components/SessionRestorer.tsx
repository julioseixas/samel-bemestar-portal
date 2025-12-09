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
          // Sessão existe no localStorage - apenas renova expiração dos cookies
          console.log("[SessionRestorer] Sessão encontrada no localStorage, renovando cookies...");
          renewAuthCookies();
          return;
        }
        
        // localStorage vazio - tenta restaurar dos cookies
        console.log("[SessionRestorer] localStorage vazio, tentando restaurar dos cookies...");
        
        if (!hasValidCookieSession()) {
          console.log("[SessionRestorer] Nenhuma sessão válida nos cookies");
          return;
        }
        
        const authData = getAuthFromCookies();
        
        if (!authData) {
          console.log("[SessionRestorer] Dados de autenticação inválidos nos cookies");
          return;
        }
        
        // Restaura dados no localStorage
        console.log("[SessionRestorer] Restaurando sessão dos cookies para localStorage...");
        
        localStorage.setItem("user", authData.token);
        localStorage.setItem("titular", JSON.stringify(authData.titular));
        localStorage.setItem("patientData", JSON.stringify(authData.patientData));
        localStorage.setItem("listToSchedule", JSON.stringify(authData.listToSchedule));
        localStorage.setItem("rating", authData.rating);
        
        // Renova expiração dos cookies (sliding expiration)
        renewAuthCookies();
        
        console.log("[SessionRestorer] Sessão restaurada com sucesso!");
        
        // Força reload para aplicar a sessão restaurada
        // Apenas se estamos na página de login
        if (window.location.pathname === "/" || window.location.pathname === "/login") {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("[SessionRestorer] Erro ao restaurar sessão:", error);
      }
    };

    restoreSession();
  }, []);

  // Componente invisível - não renderiza nada
  return null;
};
