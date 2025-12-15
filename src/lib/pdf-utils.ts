/**
 * Utility functions for PDF handling with Android WebView support
 */

/**
 * Convert a Blob to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Handle PDF download with Android WebView bridge support
 * Falls back to standard browser download if not in WebView
 */
export const handlePdfDownload = async (pdfBlob: Blob, fileName: string): Promise<boolean> => {
  try {
    // Check if we're in Android WebView with download support
    if (window.AndroidNotificationBridge?.downloadFile) {
      const base64 = await blobToBase64(pdfBlob);
      window.AndroidNotificationBridge.downloadFile(base64, fileName);
      return true;
    }

    // Fallback: Standard browser download
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};

/**
 * Handle PDF sharing with Android WebView bridge support
 * Falls back to Web Share API if available, returns false if sharing not supported
 */
export const handlePdfShare = async (
  pdfBlob: Blob, 
  fileName: string, 
  title?: string, 
  text?: string
): Promise<boolean> => {
  try {
    // Check if we're in Android WebView with share support
    if (window.AndroidNotificationBridge?.shareFile) {
      const base64 = await blobToBase64(pdfBlob);
      window.AndroidNotificationBridge.shareFile(base64, fileName);
      return true;
    }

    // Fallback: Try Web Share API
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ 
          files: [file], 
          title: title || 'Documento PDF',
          text: text || ''
        });
        return true;
      }
    }

    // No sharing method available
    return false;
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return false;
  }
};

/**
 * Check if the current environment supports PDF download via bridge or browser
 */
export const canDownloadPdf = (): boolean => {
  return !!(window.AndroidNotificationBridge?.downloadFile || typeof document !== 'undefined');
};

/**
 * Check if the current environment supports PDF sharing
 */
export const canSharePdf = (): boolean => {
  if (window.AndroidNotificationBridge?.shareFile) {
    return true;
  }
  
  if (navigator.share && navigator.canShare) {
    try {
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      return navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  }
  
  return false;
};
