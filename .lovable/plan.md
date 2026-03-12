
Objetivo: eliminar o “salto para 5” no iOS/Safari/WebView da pergunta `Q1` sem regressão em Android/Desktop.

Diagnóstico com base nos seus testes
- O padrão “10 aparece e logo vira 5” + “segundo toque em 10 fixa” confirma evento sintético tardio (mouse compat) sobrescrevendo o primeiro toque.
- Isso só em `Q1` porque é a única escala com 10 botões (mais suscetível a remapeamento de toque/coordenação no Safari).

Plano de implementação

1) Remover dependência de `setTimeout` para bloqueio de touch
- Em `src/pages/EvaluateProfessional.tsx`, substituir o controle atual `touchHandled` por um bloqueio por timestamp:
  - `ignoreMouseUntilRef` (por índice/pergunta)
  - janela inicial: ~1200ms após `touchstart`
- Motivo: timeout simples libera cedo demais para eventos sintéticos tardios do iOS.

2) Tratar origem do evento de forma explícita
- `onTouchStart`: processa rating imediatamente e atualiza `ignoreMouseUntilRef`.
- `onMouseDown`: antes de processar, valida `Date.now() >= ignoreMouseUntilRef[...]`; se não, ignora.
- Opcional de robustez: também proteger `onClick` com a mesma regra (caso WebView dispare click compat).

3) Guard-rail específico para Q1 (anti-overwrite)
- Em `handleRatingChange`, adicionar proteção para `Q1`:
  - se evento for mouse dentro da janela pós-touch, ignorar atualização.
- Manter lock temporal de Q1 (ajustado para coexistir com o novo bloqueio, sem conflito).

4) Ajuste de usabilidade para reduzir mis-target em Q1
- Aumentar área clicável do botão (não só do ícone) para touch target mínimo no mobile.
- Mantém visual atual, mas reduz chance de target incorreto em estrelas 6-10.

Detalhes técnicos (resumo)
- Arquivo: `src/pages/EvaluateProfessional.tsx`
- Trocas principais:
  - `touchHandled + setTimeout` -> `ignoreMouseUntilRef + validação por timestamp`
  - `handleRatingChange(..., source)` para distinguir touch vs mouse
  - proteção adicional de `onClick` (se necessário)
  - touch target maior para botões de estrela em `Q1`

Critérios de aceite (E2E)
1. iOS Safari/WebView: primeiro toque em 6–10 permanece no valor escolhido.
2. Segundo toque em qualquer valor também permanece estável.
3. Valores 1–5 continuam corretos.
4. Android e desktop mantêm comportamento normal (sem atraso/perda de clique).
