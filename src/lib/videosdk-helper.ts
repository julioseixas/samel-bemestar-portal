/**
 * Helper para integração com `@videosdk.live/videosdk-media-processor-web`.
 *
 * Objetivo: configurar manualmente o `publicPath` da lib em ambientes como WebView,
 * onde a detecção automática do Webpack falha e gera o erro:
 * "Automatic publicPath is not supported in this browser".
 *
 * Estratégia:
 * - Usar a própria API da biblioteca, chamando `setConfig({ publicPath })` se existir.
 * - Fazer isso imediatamente após o import dinâmico, antes de criar/initializar o processor.
 * - Não depender de variáveis globais de Webpack (__webpack_public_path__), já que o app usa Vite.
 */

const PUBLIC_PATH = "https://samel-bemestar-portal.lovable.app/";

let configApplied = false;

/**
 * Importa o VirtualBackgroundProcessor e aplica `setConfig` se estiver disponível.
 */
export const importVirtualBackgroundProcessor = async () => {
  // Import dinâmico da biblioteca completa
  const module: any = await import("@videosdk.live/videosdk-media-processor-web");

  // Aplica configuração de publicPath apenas uma vez, se a API existir
  if (!configApplied && typeof module.setConfig === "function") {
    try {
      module.setConfig({ publicPath: PUBLIC_PATH });
      console.log("[VideoSDK Helper] setConfig aplicado com publicPath:", PUBLIC_PATH);
      configApplied = true;
    } catch (error) {
      console.warn("[VideoSDK Helper] Falha ao aplicar setConfig:", error);
    }
  }

  if (!module.VirtualBackgroundProcessor) {
    throw new Error("VirtualBackgroundProcessor não encontrado no módulo videosdk-media-processor-web");
  }

  return module.VirtualBackgroundProcessor as new () => any;
};
