

## Bug: Download múltiplo de laudos não funciona

### Causa raiz identificada

Há **dois problemas** no `handleDownloadMultipleReports` em `ExamDetailsDialog.tsx`:

1. **`html2canvas` não captura elementos off-screen corretamente.** O `tempDiv` é posicionado com `left: -9999px`, mas `html2canvas` depende do layout visual do DOM para renderizar. Elementos fora da viewport são capturados como vazios ou com dimensões zero, resultando em PDFs em branco ou falha silenciosa.

2. **Browsers bloqueiam downloads programáticos múltiplos em sequência.** Tanto Safari/iOS quanto Chrome/Android bloqueiam silenciosamente a criação de múltiplos `<a>` com `.click()` em rápida sucessão (mesmo com delay de 500ms). Apenas o primeiro download passa; os demais são descartados sem erro. No WebView (Android), o `saveBase64File` pode ter comportamento similar dependendo da implementação nativa.

3. **A imagem do logo (`samelLogo`) não tem tempo de carregar** no elemento temporário antes do `html2canvas` capturar, resultando em logo ausente no PDF.

### Correção proposta

**Arquivo:** `src/components/ExamDetailsDialog.tsx` — função `handleDownloadMultipleReports`

**Estratégia:** Em vez de gerar N PDFs separados (que o browser bloqueia), gerar **um único PDF concatenado** com todos os laudos selecionados, separados por page breaks.

1. Criar um único `tempDiv` com todos os laudos selecionados, cada um em um wrapper com `style="page-break-before: always"` (exceto o primeiro).
2. Posicionar o `tempDiv` dentro da viewport mas invisível (`opacity: 0; position: fixed; top: 0; left: 0; z-index: -1`) para que o `html2canvas` consiga capturar corretamente.
3. Aguardar o carregamento das imagens (logo) com um `await` de preload antes de capturar.
4. Gerar um único blob PDF e fazer um único download com nome `laudos-selecionados.pdf`.
5. Remover o `tempDiv` após conclusão.

Isso resolve ambos os ambientes (web e WebView) pois há apenas uma chamada de download.

