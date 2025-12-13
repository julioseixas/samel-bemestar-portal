import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Extend Window interface for Android PIP support
declare global {
  interface Window {
    handlePictureInPictureChange?: (isInPictureInPictureMode: boolean) => void;
    AndroidNotificationBridge?: {
      triggerTestNotification: (title: string, message: string) => void;
      setPipPermission: (isAllowed: boolean) => void;
      enterNativePictureInPicture: () => void;
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

  if (isInPictureInPictureMode) {
    document.body.classList.add("pip-active");
  } else {
    document.body.classList.remove("pip-active");
  }

  // Dispatch custom event for React components to listen
  window.dispatchEvent(
    new CustomEvent("androidPipModeChange", {
      detail: { isInPipMode: isInPictureInPictureMode },
    })
  );
};

createRoot(document.getElementById("root")!).render(<App />);
