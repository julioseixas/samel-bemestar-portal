

## Adicionar coluna NM_PACIENTE (Nome do Paciente) ao Historico de Coparticipacao

### Problema
Atualmente, ao fazer o `flatMap` dos procedimentos, a informacao de `NM_PACIENTE` (que esta no nivel `dados[]`) e perdida. Como `dados` pode conter multiplos objetos (titular + dependentes), e necessario preservar essa informacao em cada procedimento.

### Solucao

**Arquivo:** `src/pages/CoparticipationHistory.tsx`

1. **Criar nova interface** que estende `ProcedimentoItem` adicionando `NM_PACIENTE`:
   ```typescript
   interface ProcedimentoComPaciente extends ProcedimentoItem {
     NM_PACIENTE: string;
   }
   ```

2. **Ajustar o flatMap** no `fetchHistory` para propagar o `NM_PACIENTE` para cada procedimento:
   ```typescript
   const allProcedimentos = result.dados.flatMap((d) =>
     (d.CONTRATOS || []).flatMap((c) =>
       (c.PROCEDIMENTOS || []).map((p) => ({
         ...p,
         NM_PACIENTE: d.NM_PACIENTE,
       }))
     )
   );
   ```

3. **Atualizar o state** para usar `ProcedimentoComPaciente[]` em vez de `ProcedimentoItem[]`.

4. **Adicionar coluna "Paciente" na tabela desktop** (como primeira coluna para destaque).

5. **Adicionar campo "Paciente" nos cards mobile**.

6. **Atualizar o filtro de busca** para tambem buscar por nome do paciente.

