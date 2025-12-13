import React, { useEffect } from 'react';
import { useTheme } from "next-themes";

// Define a interface para o AndroidBridge
declare global {
  interface Window {
    setThemeFromAndroid: ((theme: 'light' | 'dark') => void) | null;
    AndroidBridge?: {
      notifyThemeChange?: (theme: string) => void;
    };
  }
}

export const AndroidThemeSync = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // 1. Expor a função globalmente para o WebView nativo
    window.setThemeFromAndroid = (newTheme: 'light' | 'dark') => {
      console.log("Android calling setTheme:", newTheme);
      setTheme(newTheme);
    };

    // 2. Opcional: Notificar o Android sobre o tema atual ao montar
    if (window.AndroidBridge && typeof window.AndroidBridge.notifyThemeChange === 'function') {
      const currentTheme = theme || localStorage.getItem('theme') || 'light';
      window.AndroidBridge.notifyThemeChange(currentTheme);
    }

    return () => {
      // Limpeza ao desmontar
      window.setThemeFromAndroid = null;
    };
  }, [setTheme, theme]);

  // Retorna os componentes filhos
  return <>{children}</>;
};
