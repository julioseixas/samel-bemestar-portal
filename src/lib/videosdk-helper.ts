/**
 * Helper para garantir que o VideoSDK processor consiga detectar o publicPath em WebViews.
 * 
 * O problema: A biblioteca @videosdk.live/videosdk-media-processor-web usa detecção automática
 * de publicPath do Webpack, que falha em WebViews porque document.currentScript é null
 * durante dynamic imports.
 * 
 * A solução: Injetar um script tag fake com src apontando para o domínio correto antes
 * do dynamic import, permitindo que a detecção automática do Webpack funcione.
 */

const PUBLIC_PATH = "https://samel-bemestar-portal.lovable.app/";

let pathEnsured = false;

export const ensureVideoSDKPublicPath = (): void => {
  // Evita executar múltiplas vezes
  if (pathEnsured) return;

  const isWebView =
    navigator.userAgent.toLowerCase().includes("wv") ||
    navigator.userAgent.toLowerCase().includes("webview") ||
    (window as any).AndroidBridge !== undefined ||
    (window as any).webkit?.messageHandlers !== undefined;

  if (isWebView) {
    console.log("[VideoSDK Helper] Detectado WebView, configurando publicPath...");

    // Método 1: Criar um script tag fake com src apontando para o domínio
    // Isso permite que document.currentScript funcione corretamente
    const fakeScript = document.createElement("script");
    fakeScript.src = `${PUBLIC_PATH}videosdk-loader.js`;
    fakeScript.id = "videosdk-public-path-helper";
    
    // Adiciona ao head se ainda não existir
    if (!document.getElementById("videosdk-public-path-helper")) {
      document.head.appendChild(fakeScript);
    }

    // Método 2: Definir as variáveis globais do Webpack/Vite
    try {
      // @ts-ignore - Variável global do Webpack
      __webpack_public_path__ = PUBLIC_PATH;
    } catch (e) {
      // Variável não existe, tentamos outra forma
    }

    // Define no window como fallback
    (window as any).__webpack_public_path__ = PUBLIC_PATH;
    (window as any).__vite_public_path__ = PUBLIC_PATH;

    console.log("[VideoSDK Helper] PublicPath configurado para:", PUBLIC_PATH);
  }

  pathEnsured = true;
};

/**
 * Importa o VirtualBackgroundProcessor de forma segura para WebViews.
 * Configura o publicPath antes de importar a biblioteca.
 */
export const importVirtualBackgroundProcessor = async () => {
  // Garante que o publicPath está configurado antes do import
  ensureVideoSDKPublicPath();

  // Aguarda um tick para garantir que o script tag foi processado
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Agora faz o dynamic import
  const { VirtualBackgroundProcessor } = await import(
    "@videosdk.live/videosdk-media-processor-web"
  );

  return VirtualBackgroundProcessor;
};
