

## Problema

A imagem mostra o PDF gerado com 3 páginas: página 1 quase em branco, página 2 com o conteúdo real, página 3 em branco. Isso acontece porque:

1. O `pageBreakBefore: 'always'` no segundo grupo força uma quebra de página que o `html2pdf` interpreta criando páginas vazias
2. O `pageBreakInside: 'avoid'` no `SingleRequestTemplate` pode empurrar o conteúdo para a próxima página se não couber
3. O separador visual ("Pedido X de Y") com `print:hidden` é ignorado na impressão mas **não** pelo `html2canvas` — ele ocupa espaço no PDF
4. O `pagebreak: { mode: ['css', 'legacy'] }` no `html2pdf` está processando essas regras CSS de forma incorreta

## Solução

Abordagem em duas partes: corrigir o componente visual e mudar a estratégia de geração de PDF para múltiplos pedidos.

### 1. `src/components/GroupedExamRequestView.tsx`

- Remover `pageBreakInside: 'avoid'` do `SingleRequestTemplate` — deixar o `html2pdf` fluir naturalmente
- Remover `pageBreakBefore: 'always'` dos grupos — não usar CSS page breaks para controle de PDF
- Adicionar atributo `data-pdf-section` em cada grupo para permitir captura individual
- Manter o separador visual apenas para exibição no modal (sem impacto no PDF)

### 2. `src/pages/LabExamRequests.tsx` — funções `handleDownloadMultiplePDF` e `handleShareMultiple`

Trocar a estratégia de uma única chamada `html2pdf` sobre o container inteiro por uma abordagem de **captura por seção**:

- Buscar todos os elementos `[data-pdf-section]` dentro do container `#printMultiple`
- Para cada seção, gerar um PDF individual com `html2pdf` e extrair as páginas
- Ou, mais simples: gerar o PDF normalmente mas **sem** `pagebreak` CSS, usando `pagebreak: { mode: [] }` (desabilitar completamente) e deixar o `html2pdf` fazer a paginação automática baseada apenas no tamanho do conteúdo

A abordagem mais simples e menos invasiva: remover todas as regras CSS de page break e usar `pagebreak: { mode: [] }` para deixar o `html2pdf` paginar naturalmente pelo tamanho do conteúdo.

### Arquivos a editar:
- `src/components/GroupedExamRequestView.tsx` — remover estilos de page break, adicionar `data-pdf-section`
- `src/pages/LabExamRequests.tsx` — ajustar opções de `pagebreak` nas funções de download/share múltiplo

