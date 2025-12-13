import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Extend Window interface for Android PIP support
declare global {
  interface Window {
    handlePictureInPictureChange?: (isInPictureInPictureMode: boolean) => void;
    AndroidNotificationBridge?: {
      triggerTestNotification: (title: string, message: string) => void;
    };
  }
}

/**
 * Função chamada pelo código Kotlin/Android quando o app entra ou sai do modo PIP.
 * O Android executa: window.handlePictureInPictureChange(true)
 * * NOTA: Esta função DEVE estar no escopo global (window).
 *
 * @param {boolean} isInPictureInPictureMode - true se o app está em PIP, false caso contrário.
 */
window.handlePictureInPictureChange = (isInPictureInPictureMode: boolean) => {
  console.log("PIP Status (Recebido do Android):", isInPictureInPictureMode);

  // O próximo passo será usar essa informação para atualizar o estado React
  // (ex: usando um Context/Redux) e fazer ajustes visuais via CSS/Classes.

  if (isInPictureInPictureMode) {
    document.body.classList.add("pip-active");
    // Adicionar lógica de UI aqui (ex: pausar animações)
  } else {
    document.body.classList.remove("pip-active");
    // Remover lógica de UI
  }
};

createRoot(document.getElementById("root")!).render(<App />);
