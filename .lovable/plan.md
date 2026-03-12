

## Diminuir card de ajuda e exibir fila inline na tela de check-in

### Mudanca 1: Compactar o card de ajuda

**Arquivo:** `src/components/TelemedicineHelpSection.tsx`

Transformar o card de ajuda `variant="full"` em um formato mais compacto:
- Remover o Card/CardHeader e usar apenas um botao/link que abre um Dialog com o conteudo completo
- O resultado sera um simples botao "Como usar a Telemedicina" com icone de ajuda que, ao clicar, abre um modal com o accordion completo
- Isso libera espaco vertical na tela

### Mudanca 2: Exibir posicao na fila inline apos check-in

**Arquivo:** `src/pages/OnlineConsultationDetails.tsx`

Alterar o fluxo pos-check-in para nao navegar mais para `/telemedicine-queue`:

1. Adicionar novo state para armazenar dados da fila por appointment:
```typescript
const [appointmentQueueData, setAppointmentQueueData] = useState<Record<number, any[]>>({});
```

2. Nos fluxos de check-in (facial e email), em vez de `navigate("/telemedicine-queue")`:
   - Salvar os dados retornados por `ListarFilaTele` no state `appointmentQueueData` indexado pelo `idAgenda`
   - Recarregar os agendamentos (ja faz isso)
   - Nao navegar - permanecer na tela

3. Na renderizacao do card de appointment, quando `hasCheckedIn === true`:
   - Verificar se existe `appointmentQueueData[appointment.idAgenda]`
   - Se existir, exibir um mini-card com a posicao na fila (posicao, horario, status)
   - Se nao existir ainda, buscar automaticamente via `ListarFilaTele` ao detectar `possuiAtendimento === "S"`

4. A secao de fila inline tera:
   - Posicao do paciente na fila (baseado no `idCliente`)
   - Horario da consulta e horario do check-in
   - Status atual
   - Auto-refresh a cada 10 segundos para manter atualizado

### Detalhes tecnicos

**TelemedicineHelpSection.tsx:**
- O `variant="full"` passa a renderizar um botao compacto com Dialog
- Layout: linha unica com icone + texto "Como usar a Telemedicina" + seta, estilizado como um banner fino
- Ao clicar, abre Dialog com o mesmo conteudo do Accordion atual

**OnlineConsultationDetails.tsx - Mudancas principais:**

Novo state:
```typescript
const [inlineQueueData, setInlineQueueData] = useState<Record<string, any[]>>({});
```

useEffect para buscar fila automaticamente para appointments com check-in feito:
```typescript
useEffect(() => {
  appointments.filter(a => a.possuiAtendimento === "S").forEach(appointment => {
    if (!inlineQueueData[appointment.idAgenda]) {
      fetchQueueForAppointment(appointment);
    }
  });
}, [appointments]);
```

Funcao `fetchQueueForAppointment` que popula `inlineQueueData`.

Intervalo de auto-refresh para appointments com check-in.

Na renderizacao do card com `hasCheckedIn`, adicionar abaixo dos botoes existentes:
```
+--------------------------------------+
| Sua posicao na fila                  |
| Posicao: #2                         |
| Horario consulta: 14:00             |
| Check-in: 13:45                     |
| Status: Aguardando atendimento      |
| Atualizando a cada 10s...           |
+--------------------------------------+
```

Os botoes "Entrar na Sala de Consulta" e "Ver Fila de Atendimento" continuam funcionando normalmente.

