
## Plano: Ativar V1 e Desativar V2 do Agendamento de Consultas

### Resumo
Inverter a configuração atual para que a versão V1 (com agendamento inteligente e múltiplas especialidades) seja a versão ativa, enquanto a V2 (simplificada) fica comentada para referência futura.

### Alterações no arquivo `src/App.tsx`

1. **Rota `/appointment-details`**: Trocar de `AppointmentDetailsV2` para `AppointmentDetails` (V1)

2. **Rota `/smart-scheduling`**: Descomentar para permitir o fluxo de agendamento inteligente

3. **Comentar referência à V2**: Manter o código da V2 comentado para uso futuro

### Resultado Final

| Rota | Componente | Status |
|------|------------|--------|
| `/appointment-details` | `AppointmentDetails` (V1) | **Ativo** |
| `/smart-scheduling` | `SmartScheduling` | **Ativo** |
| `/appointment-details-v2` | `AppointmentDetailsV2` | Comentado |

### Funcionalidades da V1 que estarão disponíveis
- Seleção de múltiplas especialidades com autocomplete
- Modal de escolha entre "Agendamento Inteligente" e "Agendar um por vez"
- Barra de progresso para fluxo convencional
- Agendamento inteligente com busca de horários combinados (mesma unidade ou multi-unidade)
