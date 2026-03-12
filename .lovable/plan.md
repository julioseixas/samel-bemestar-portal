

## Problema

No modal de visualização múltipla (linhas 838-851), os laudos são exibidos em sequência com apenas um `border-b` e um título simples como separação. Cada `ExamReportView` já renderiza com cabeçalho completo (logo Samel, dados do hospital), mas visualmente parece um bloco contínuo porque não há separação clara entre documentos.

## Solução

Melhorar a separação visual no modal de múltiplos laudos para que cada exame pareça um documento independente:

**Arquivo:** `src/components/ExamDetailsDialog.tsx` — modal de visualização múltipla (linhas 837-851)

1. Envolver cada `ExamReportView` em um card com borda, sombra e fundo distinto — simulando uma "página" separada
2. Adicionar um separador visual mais forte entre exames (linha com texto "Exame X de Y")
3. Remover o título redundante `"Exame {index + 1}: {exam.procedimentoExame}"` que aparece antes do cabeçalho do laudo (o próprio `ExamReportView` já mostra o procedimento no corpo)
4. Adicionar `rounded-lg shadow-md border-2` ao wrapper de cada exame para dar aparência de documento/página individual

Mudança concentrada nas linhas 838-851 do arquivo.

