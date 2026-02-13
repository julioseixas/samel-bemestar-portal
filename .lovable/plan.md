

## Corrigir mensagens dos modulos desabilitados na tela de Internacao

### Problema
Quando o paciente nao possui dados de internacao ativa (`idAtendimento`), os cards de "Verificar Prescricao", "Fale Conosco" e "Avaliar Profissional" mostram "Em breve disponivel", dando a impressao de que os modulos ainda nao foram desenvolvidos. Na verdade, eles ja existem -- o paciente simplesmente nao possui internacao ativa para acessa-los.

### Solucao

**Arquivo:** `src/pages/HospitalizationOptions.tsx`

Substituir as mensagens "Em breve disponivel" por textos que reflitam a real situacao:

| Card | Mensagem atual (desabilitado) | Nova mensagem |
|------|-------------------------------|---------------|
| Verificar Prescricao | "Em breve disponivel" | "Sem internacao ativa" |
| Fale Conosco | "Em breve disponivel" | "Sem internacao ativa" |
| Avaliar Profissional | "Em breve disponivel" | "Sem internacao ativa" |

Sao 3 alteracoes simples de texto nas linhas 127, 153 e 179.

