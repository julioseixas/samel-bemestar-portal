

## Correcao do fluxo de internacao e exibicao de multiplas cirurgias

### Problema 1: Modal bloqueando acesso ao acompanhamento cirurgico
Quando `EfetuarLoginInternacao` retorna `sucesso: false` com a mensagem "Nao foi encontrado nenhum Atendimento", o codigo faz `return` imediatamente (linha 161-165 de HospitalizationSchedule.tsx), impedindo que os dados da agenda cirurgica (que podem ter retornado com sucesso da outra API) sejam salvos no localStorage. O paciente nunca chega a tela de opcoes.

### Problema 2: Apenas a primeira cirurgia e exibida
Em `SurgicalTracking.tsx`, o codigo pega apenas `parsed[0]` do array, ignorando as demais cirurgias.

### Solucao

**Arquivo 1: `src/pages/HospitalizationSchedule.tsx`**

Reorganizar a logica apos as chamadas paralelas:
- Salvar os dados da agenda cirurgica **antes** de verificar o resultado do login
- Se o login falhar MAS existirem dados de agenda cirurgica, ainda assim navegar para `/hospitalization-options` (sem salvar `hospitalizationData`)
- Se o login falhar E nao houver agenda cirurgica, ai sim mostrar o modal de aviso

Logica corrigida (substituir linhas 160-193):
```typescript
// Salva agenda cirurgica independente do login
if (agendaData.sucesso && agendaData.dados) {
  localStorage.setItem("surgicalSchedule", JSON.stringify(agendaData.dados));
}

// Verifica login
if (loginData.sucesso) {
  // Salva dados normalmente
  localStorage.setItem("selectedPatient", JSON.stringify(patientData));
  localStorage.setItem("hospitalizationData", JSON.stringify(loginData.dados));
  navigate("/hospitalization-options");
} else if (agendaData.sucesso && agendaData.dados) {
  // Login falhou mas tem agenda cirurgica - permite acessar
  localStorage.setItem("selectedPatient", JSON.stringify(patientData));
  navigate("/hospitalization-options");
} else {
  // Nenhum dado disponivel - mostra aviso
  setWarningMessage(loginData.mensagem || "Nao foi possivel acessar as informacoes de internacao.");
  setShowWarningDialog(true);
}
```

**Arquivo 2: `src/pages/SurgicalTracking.tsx`**

Alterar para exibir todas as cirurgias do array:
- Mudar o state de `SurgicalData | null` para `SurgicalData[]`
- Iterar sobre o array e renderizar um card para cada cirurgia
- Manter o mesmo layout visual de cada card (progress bar, procedimento, data, local, profissional)

### Detalhes tecnicos

**SurgicalTracking.tsx - Mudancas principais:**

1. State atualizado:
```typescript
const [surgicalDataList, setSurgicalDataList] = useState<SurgicalData[]>([]);
```

2. useEffect atualizado para carregar o array completo:
```typescript
const parsed = JSON.parse(storedSurgicalSchedule);
const dataArray = Array.isArray(parsed) ? parsed : [parsed];
setSurgicalDataList(dataArray);
```

3. Renderizacao com `.map()` sobre `surgicalDataList`, gerando um card completo (com progress bar, detalhes e guia) para cada cirurgia do array.

