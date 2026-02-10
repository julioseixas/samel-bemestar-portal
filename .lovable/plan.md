

## Correcao da estrutura de dados do Historico de Coparticipacao

### Problema
A API retorna uma estrutura com 3 niveis de aninhamento, mas o codigo atual espera apenas 2:

```text
Estrutura esperada pelo codigo atual:
  dados[] -> CONTRATOS[] (itens diretos)

Estrutura real da API:
  dados[] -> CONTRATOS[] -> PROCEDIMENTOS[] (itens estao aqui)
```

Os procedimentos (com DS_PROCEDIMENTO, VL_LANC_MONEY_FORMAT, etc.) estao dentro de `PROCEDIMENTOS`, nao diretamente em `CONTRATOS`.

### Solucao

Atualizar `src/pages/CoparticipationHistory.tsx`:

1. **Ajustar a interface** para refletir a estrutura real:
   - Adicionar interface `ContratoGroup` com `NR_CARTEIRINHA`, `NM_EMPRESA` e `PROCEDIMENTOS[]`
   - Manter `ContratoItem` (renomear para `ProcedimentoItem`) com os campos dos procedimentos
   - Atualizar `HistoricoResponse.dados` para usar `CONTRATOS: ContratoGroup[]`

2. **Corrigir o flatMap na funcao fetchHistory** (linha 79):
   - De: `result.dados.flatMap((d) => d.CONTRATOS || [])`
   - Para: `result.dados.flatMap((d) => (d.CONTRATOS || []).flatMap((c) => c.PROCEDIMENTOS || []))`

Isso extrai corretamente os procedimentos de dentro de cada contrato e a listagem funcionara sem outras alteracoes.

### Detalhes tecnicos

Arquivo modificado: `src/pages/CoparticipationHistory.tsx`

Interfaces atualizadas:
```typescript
interface ProcedimentoItem {
  NR_ATENDIMENTO: string;
  NR_AUTORIZACAO: number | null;
  DT_ENTRADA_EXECUCAO: string;
  MES_COBRANCA: string;
  DT_ENTRADA_EXECUCAO_BR_STRING: string;
  MES_COBRANCA_BR_STRING: string;
  DS_PROCEDIMENTO: string;
  VL_LANC_MONEY_FORMAT: string;
  VL_LANC_NUMBER: number;
  DS_PROF_CONSULTA: string | null;
}

interface ContratoGroup {
  NR_CARTEIRINHA: string;
  NM_EMPRESA: string;
  PROCEDIMENTOS: ProcedimentoItem[];
}

interface HistoricoResponse {
  codigo: number;
  sucesso: boolean;
  menssagem: string;
  dados: {
    NM_PACIENTE: string;
    CONTRATOS: ContratoGroup[];
  }[];
}
```

Linha 79 corrigida:
```typescript
const allProcedimentos = result.dados.flatMap((d) =>
  (d.CONTRATOS || []).flatMap((c) => c.PROCEDIMENTOS || [])
);
setContratos(allProcedimentos);
```
