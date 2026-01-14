/**
 * ==========================================
 * VERSIONAMENTO DO AGENDAMENTO DE CONSULTAS
 * ==========================================
 * 
 * V1 (ATIVO) - Fluxo Original:
 *   - Seleção de uma única especialidade por vez
 *   - Navegação direta para profissionais
 *   - Sem modal de escolha de fluxo
 *   - Sem agendamento inteligente integrado
 *   - Arquivo: AppointmentDetailsV1.tsx
 * 
 * V2 (COMENTADO) - Agendamento Inteligente:
 *   - Seleção de múltiplas especialidades
 *   - Modal de escolha de fluxo (convencional vs inteligente)
 *   - Integração com SmartScheduling.tsx
 *   - Fluxo convencional com barra de progresso
 *   - Arquivo: AppointmentDetailsV2.tsx
 * 
 * Para ativar a V2, descomente a importação abaixo e comente a V1
 */

// ====== V1 - Versão Original (ATIVA) ======
import AppointmentDetailsV1 from "./AppointmentDetailsV1";
export default AppointmentDetailsV1;

// ====== V2 - Agendamento Inteligente (COMENTADO) ======
// import AppointmentDetailsV2 from "./AppointmentDetailsV2";
// export default AppointmentDetailsV2;
