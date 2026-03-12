
## Fix definitivo: debounce com setTimeout para Q1 (iPhone Safari)

### Problema
No iPhone/Safari, ao tocar na estrela 10, o browser dispara um segundo evento fantasma ~200-300ms depois que retargeteia para a estrela 5 (mesma posição visual na linha de cima). As guardas anteriores não funcionam porque o evento fantasma chega como um evento legítimo separado.

### Solução: Debounce por pergunta

**Arquivo:** `src/pages/EvaluateProfessional.tsx`

Substituir a atualização imediata do rating por um debounce com `setTimeout`:

1. Criar um `useRef` para armazenar timers pendentes por índice de pergunta (`Record<number, ReturnType<typeof setTimeout>>`)
2. No `handleRatingChange`:
   - Cancelar qualquer timer pendente para aquele índice (`clearTimeout`)
   - Criar novo `setTimeout` de ~350ms que aplica o rating
   - Isso garante que se dois eventos chegarem em sequência rápida (toque real + fantasma), apenas o **último** é aplicado
3. Para perguntas que **não** são Q1 (escala 1-5), aplicar imediatamente sem debounce para manter a experiência responsiva
4. Remover a lógica de guarda temporal anterior (`lastRatingUpdate` ref) que não estava funcionando

**Comportamento esperado:**
- Toque na estrela 10 → timer de 350ms inicia
- Evento fantasma na estrela 5 chega ~200ms depois → cancela timer anterior, inicia novo timer de 350ms
- Mas como o evento fantasma é o **segundo**, e queremos o **primeiro** (o real)...

Na verdade, a abordagem correta é inversa: **priorizar o primeiro toque e ignorar tudo nos próximos 600ms** (lock temporal):

1. `useRef` com timestamp do último rating aceito por índice
2. No `handleRatingChange` para Q1:
   - Se menos de 600ms desde o último rating aceito para esse índice → ignorar
   - Senão → aceitar, atualizar timestamp e aplicar rating
3. Para perguntas não-Q1: aplicar imediatamente sem lock

Isso é mais simples e robusto: o primeiro toque (real) passa, o fantasma (~200ms depois) é bloqueado.

**Mudança concentrada em:** linhas 39, 99-116 do arquivo atual.
