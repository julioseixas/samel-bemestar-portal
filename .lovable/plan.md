

## Problema

A abordagem atual com `generateSectionBasedPdf` (usando `html2canvas` + `jsPDF` manual com slicing de canvas) está gerando PDFs com layout incorreto. O usuário disse que a versão anterior — que usava `html2pdf` diretamente com `pagebreak: { mode: [] }` — era a que mais se aproximava do resultado ideal (apenas cortava o texto final).

## Solução

Voltar à abordagem simples com `html2pdf` (que funcionava bem) e corrigir o corte do texto final aumentando a margem inferior do PDF.

### Arquivo: `src/pages/LabExamRequests.tsx`

1. **Remover** a função `generateSectionBasedPdf` e os imports de `html2canvas` e `jsPDF` (que não são mais necessários para este fluxo)

2. **Reescrever `handleDownloadMultiplePDF`** para usar `html2pdf` diretamente no container `#printMultiple`, igual ao padrão do single download:
   - Esconder elementos `.pdf-hide` antes da captura
   - Usar `html2pdf().set(options).from(container).output("blob")`
   - Restaurar elementos `.pdf-hide` depois
   - Opções: `margin: [10, 10, 20, 10]` (margem inferior maior para evitar corte), `pagebreak: { mode: [] }`, `html2canvas: { scale: 2, useCORS: true, scrollY: 0 }`

3. **Reescrever `handleShareMultiple`** com a mesma lógica

### Arquivo: `src/components/GroupedExamRequestView.tsx`

Sem alterações — o componente atual com `data-pdf-section` e `pdf-hide` nos separadores está correto.

