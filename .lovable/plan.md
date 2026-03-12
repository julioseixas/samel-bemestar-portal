

## Plano: Corrigir rating 10 estrelas no iOS/Safari

### Abordagem
Substituir `onPointerDown` + `onClick` por `onTouchStart` + `onMouseDown` com ref `touchHandled`. Esta é uma técnica universal — não detecta plataforma, funciona por natureza dos eventos:
- Touch devices: `onTouchStart` processa, ref bloqueia `onMouseDown` sintético
- Desktop: `onTouchStart` nunca dispara, `onMouseDown` funciona normalmente

### Arquivo: `src/pages/EvaluateProfessional.tsx`

1. Adicionar `const touchHandled = useRef(false);` junto aos outros refs

2. Nos botões de estrela, substituir `onPointerDown` e `onClick` por:
```tsx
onTouchStart={(e) => {
  e.preventDefault();
  touchHandled.current = true;
  handleRatingChange(index, star, avaliacao.idPergunta);
  setTimeout(() => { touchHandled.current = false; }, 400);
}}
onMouseDown={(e) => {
  e.preventDefault();
  if (touchHandled.current) return;
  handleRatingChange(index, star, avaliacao.idPergunta);
}}
```

Nenhuma detecção de plataforma. Nenhum risco para ambientes existentes.

