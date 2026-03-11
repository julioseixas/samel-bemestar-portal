

## Fix: Duplo disparo de toque nas estrelas no mobile

### Problema

No mobile, ao tocar na estrela 10 (segunda linha, posição 5), o evento de toque dispara duas vezes: primeiro no elemento correto (estrela 10), e depois, ao levantar o dedo, o browser dispara um segundo evento `click` no elemento que está na mesma posição visual da primeira linha (estrela 5). Isso acontece porque o re-render causado pelo primeiro toque pode causar um reflow, ou o próprio comportamento de touch-to-click do mobile gera eventos duplicados.

### Correção

**Arquivo:** `src/pages/EvaluateProfessional.tsx`

1. Nos botões de estrela, trocar `onClick` por `onPointerDown` com `e.preventDefault()` para capturar o toque imediatamente sem gerar o evento click secundário.

2. Adicionar `touch-action: manipulation` via className nos botões para desabilitar comportamentos de toque do browser (double-tap zoom etc.).

3. Adicionar `type="button"` explícito para evitar qualquer submit acidental.

Mudança concentrada nas linhas 240-252 — apenas o `<button>` das estrelas.

