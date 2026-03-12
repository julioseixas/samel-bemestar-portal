

## Plano: Aumentar padding inferior do conteúdo do pedido para evitar corte no PDF

### Problema
O texto final do documento é cortado no PDF porque o conteúdo termina muito rente à borda inferior, e quando o `html2pdf` pagina, não há espaço suficiente para o conteúdo respirar.

### Solução
Aumentar o padding inferior em dois pontos-chave:

### 1. `src/components/GroupedExamRequestView.tsx`
- **Corpo do pedido** (linha 104): Trocar `p-6 mb-4` por `p-6 pb-10 mb-6` — mais padding inferior no conteúdo HTML renderizado
- **Container principal** (linha 31): Trocar `pb-8` por `pb-12` — mais espaço no final de cada template de pedido

### 2. `src/pages/LabExamRequests.tsx`
- Manter as opções de margem atuais (`margin: [10, 10, 20, 10]`) que já têm margem inferior maior

São apenas ajustes de classes CSS, sem mudança de lógica.

