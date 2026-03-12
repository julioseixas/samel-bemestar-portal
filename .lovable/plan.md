

## Alternativas de interface para avaliação (escala 1-10, Q1)

O problema central: 10 estrelas em linha causam eventos fantasma no iOS. Trocar a abordagem visual elimina a raiz do problema.

### Opções de interface (todas dentro de um bottom sheet / Drawer)

**1. NPS Slider (recomendada)**
- Um slider horizontal de 0-10 com marcadores numéricos visíveis.
- Um único ponto de toque arrastável -- elimina completamente o problema de múltiplos botões.
- Visual limpo, familiar (padrão NPS usado em pesquisas de satisfação).
- Cores graduais: vermelho (0-6) / amarelo (7-8) / verde (9-10).

**2. Botões numéricos em grid**
- Grid 2x5 ou linha única com botões grandes (números 1-10).
- Cada botão tem área de toque generosa (48x48px+).
- Visual claro, sem ambiguidade. Botão selecionado fica destacado.
- Menos propenso ao bug porque cada botão é um elemento independente com espaçamento.

**3. Emoji/Face scale**
- 5 faces (muito insatisfeito a muito satisfeito) mapeadas para faixas de 1-10.
- Mais intuitivo para pacientes, mas perde granularidade.

**4. Stepper com valor central**
- Número grande no centro + botões "-" e "+" nos lados.
- Impossível ter evento fantasma (só 2 botões).
- Menos visual, mais funcional.

---

### Proposta de implementação (combinar opções 1 + 2)

**Fluxo:**
1. Na lista de avaliações, cada card Q1 mostra um botão "Avaliar" em vez de estrelas inline.
2. Ao tocar, abre um **Drawer (bottom sheet)** com:
   - Pergunta no header
   - **Botões numéricos 1-10** em linha única com espaçamento generoso (principal)
   - Código de cores: vermelho (1-6), amarelo (7-8), verde (9-10)
   - Número selecionado destacado com escala e cor
   - Campo de comentário
   - Botão "Enviar Avaliação" no footer fixo
3. As avaliações com escala 1-5 (A1, B1, N1, etc.) continuam com estrelas inline como estão (sem bug nelas).

**Arquivo:** `src/pages/EvaluateProfessional.tsx`
- Importar `Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter` de `@/components/ui/drawer`
- Criar estado `openDrawerIndex` para controlar qual avaliação Q1 está aberta
- Renderizar botões numéricos 1-10 dentro do drawer (cada um ~44px, com `onClick` simples -- sem necessidade de touch guards pois é um único toque em botão grande e espaçado)
- Manter estrelas para perguntas non-Q1

**Vantagem principal:** elimina o bug do iOS na raiz, sem hacks de timing. Botões numéricos grandes e espaçados não sofrem do problema de eventos fantasma.

