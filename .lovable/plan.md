

## Corrigir bug da escala Q1 e build error

### 1. Build error — `src/pages/SignupDetails.tsx` (linha 92)
Substituir `NodeJS.Timeout` por `ReturnType<typeof setTimeout>`.

### 2. Bug da escala Q1 — `src/pages/EvaluateProfessional.tsx`

**Problema:** A linha 238 usa `[1, 2, 3, 4, 5]` para **todas** as perguntas. Quando `idPergunta === "Q1"`, deveria gerar `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`.

**Correção:**
- Na renderização das estrelas, gerar o array dinamicamente: `Array.from({length: avaliacao.idPergunta === "Q1" ? 10 : 5}, (_, i) => i + 1)`
- Reduzir o tamanho das estrelas para Q1 (`w-6 h-6` em vez de `w-8 h-8`) para caberem na tela mobile
- Na validação do submit, ajustar a mensagem de erro para refletir a escala correta

Sem mudanças de layout ou design — continua usando estrelas.

