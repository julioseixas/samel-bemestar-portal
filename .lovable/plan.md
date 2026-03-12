
Objetivo: corrigir definitivamente o bug da Q1 (0–10) no mobile, sem mudar o padrão visual de estrelas.

Diagnóstico aprofundado (causa mais provável)
- O bug persiste mesmo com `onPointerDown`, indicando que não é só “click duplo” simples.
- Na Q1, as 10 estrelas quebram em 2 linhas no mobile (`flex-wrap`). Isso cria sobreposição vertical de posição visual (ex.: estrela 10 embaixo da 5), favorecendo um segundo evento “fantasma”/retarget que sobrescreve 10 por 5.
- Como o overwrite acontece logo após marcar 10, a correção precisa bloquear sobrescrita imediata suspeita e estabilizar layout da Q1.

Plano de correção (robusto + workaround)
1) Estabilizar layout da Q1 para evitar retarget por quebra de linha
- Arquivo: `src/pages/EvaluateProfessional.tsx`
- Manter estrelas, mas para `Q1` renderizar em uma única linha estável (sem `flex-wrap`) com ajuste de tamanho/spacing para caber no mobile.
- Exemplo de abordagem: `grid-cols-10` ou `flex-nowrap` com estrelas menores (`w-5 h-5` ou `w-6 h-6`) e botão com área de toque consistente.
- Resultado: elimina o cenário “estrela 10 embaixo da 5”.

2) Blindagem contra sobrescrita fantasma (Q1 only)
- Criar guarda temporal por pergunta (via `useRef`) para ignorar atualização imediatamente subsequente que reduz brutalmente a nota (ex.: 10 -> 5 em <300–400ms).
- Regra aplicada só na Q1, para não impactar perguntas 1–5.
- Isso resolve mesmo se o browser disparar evento residual inesperado.

3) Endurecer handling de interação touch
- Manter `onPointerDown` + `preventDefault`.
- Adicionar bloqueio explícito de evento residual no botão (`onClick` no-op com `preventDefault/stopPropagation`), evitando compat-event sobrescrever estado.
- Tornar o SVG não interativo (`pointer-events-none` no ícone) para garantir target consistente no botão.

4) Ajustes de consistência interna
- Centralizar escala em helper (`getMaxRating`) para render/validação usarem a mesma regra da Q1.
- Preservar interface atual (estrelas), sem trocar para grid numérico.

Validação (obrigatória)
- Testar Q1 no mobile real (Android/iOS) em 3 cenários:
  1) toque direto na estrela 10;
  2) toque rápido repetido 10 -> 9 -> 10;
  3) toque no limite entre estrelas da segunda linha/linha única.
- Critério de aceite: nenhuma regressão para 5 após selecionar 10; nota permanece estável até nova interação intencional.
- Revalidar perguntas 1–5 para garantir que continuam sem alteração de comportamento.

Arquivos impactados
- `src/pages/EvaluateProfessional.tsx` (único arquivo funcional da correção).
