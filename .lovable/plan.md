

## Plano: Adicionar Q1 fixa no frontend para debug

Estratégia válida — isolar se o bug é do evento ou dos dados do back.

### Arquivo: `src/pages/EvaluateProfessional.tsx`

Na função `fetchAvaliacoes`, após receber os dados do back e montar `avaliacoesComResposta`, inserir uma entrada Q1 hardcoded no início do array:

```typescript
const debugQ1: AvaliacaoComResposta = {
  idCliente: "DEBUG",
  idAtendimento: idAtendimento,
  idTipoEvolucao: "DEBUG",
  idEvolucao: 0,
  dataEntrada: new Date().toISOString(),
  dsEspecialidade: "DEBUG - Frontend",
  dsEvolucao: "DEBUG",
  dsPergunta: "[DEBUG FRONTEND] Avaliação Q1 - Gerada localmente para teste",
  dsSetor: "Debug",
  idPergunta: "Q1",
  idUnidade: "0",
  medico: "Debug",
  nome: "Debug",
  nomeUsuarioAtendimento: "Debug",
  rating: 0,
  comentario: "",
};

setAvaliacoes([debugQ1, ...avaliacoesComResposta]);
```

- A Q1 do back continua no array (aparece depois)
- A Q1 de debug vem primeiro, claramente identificada com `[DEBUG FRONTEND]` no título
- O botão "Enviar Avaliação" da versão debug pode ser desabilitado (ou mantido — ao enviar com `idEvolucao: 0` o back provavelmente rejeita, sem risco)
- Isso permite testar se o bug de "salto para 5" acontece também com dados 100% locais

