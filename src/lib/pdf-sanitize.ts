/**
 * Utility functions for sanitizing HTML content for PDF generation
 */
import DOMPurify from "dompurify";

/**
 * Sanitize HTML content removing fixed widths for proper PDF rendering
 * This ensures tables and elements fit within the PDF page width
 */
export const sanitizeHtmlForPdf = (html: string): string => {
  if (!html) return "";

  // Hook to remove fixed widths
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Remove width attribute from any element
    if (node.hasAttribute && node.hasAttribute('width')) {
      node.removeAttribute('width');
    }
    // Remove height attribute from images to maintain proportion
    if (node.tagName === 'IMG' && node.hasAttribute('height')) {
      node.removeAttribute('height');
    }
    // Remove widths from inline style
    if (node.hasAttribute && node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const cleanStyle = style
        .replace(/width\s*:\s*[^;]+;?/gi, '')
        .replace(/min-width\s*:\s*[^;]+;?/gi, '')
        .replace(/max-width\s*:\s*[^;]+;?/gi, '');
      if (cleanStyle.trim()) {
        node.setAttribute('style', cleanStyle);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'meta', 'link'],
  });

  DOMPurify.removeHook('afterSanitizeAttributes');
  return clean;
};

/**
 * CSS styles for exam result content in PDF
 * These ensure tables and content fit properly within the PDF page
 */
export const pdfResultContentStyles = `
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: #000;
  word-wrap: break-word;
  overflow-wrap: anywhere;
`;

/**
 * CSS styles for tables in PDF
 */
export const pdfTableStyles = `
  <style>
    * { box-sizing: border-box; }
    table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse; }
    td, th { 
      word-wrap: break-word !important; 
      overflow-wrap: anywhere !important;
      padding: 4px 8px;
      font-size: 11px;
      vertical-align: top;
    }
    img { max-width: 100% !important; height: auto !important; }
    p, span, div { word-wrap: break-word !important; overflow-wrap: anywhere !important; }
    pre { white-space: pre-wrap !important; overflow-x: hidden !important; }
  </style>
`;
