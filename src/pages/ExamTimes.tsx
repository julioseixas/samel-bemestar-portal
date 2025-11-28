import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { getApiHeaders } from "@/lib/api-headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HorarioDisponivel {
  id: number;
  idAgenda: number;
  data: string;
  unidade: {
    id: number;
    nome: string;
  };
}

const ExamTimes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<HorarioDisponivel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();

  const { selectedProfessional, selectedConvenio } = location.state || {};

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (!selectedProfessional || !selectedConvenio) {
      navigate("/appointment-professionals");
    }
  }, [navigate, selectedProfessional, selectedConvenio]);

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!selectedProfessional || !selectedConvenio) {
        return;
      }

      try {
        setLoading(true);
        
        // Construir os parâmetros
        const params = new URLSearchParams({
          idAgenda: selectedProfessional.idAgenda.toString(),
          idConvenio: selectedConvenio
        });

        // Adicionar os idsProcedimentos como array
        selectedProfessional.idsProcedimentos.forEach((idProc: number) => {
          params.append('idsProcedimentos[]', idProc.toString());
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ListarHorariosDisponiveisParaProcedimentos3?${params}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setHorarios(data.dados);
          
          const dates = data.dados.map((horario: HorarioDisponivel) => {
            const dateStr = horario.data.split(' ')[0];
            const [year, month, day] = dateStr.split('/');
            const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return parsedDate;
          });
          
          setAvailableDates(dates);
        } else {
          toast({
            title: "Aviso",
            description: data.mensagem || "Nenhum horário disponível encontrado",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        toast({
          title: "Erro",
          description: "Erro ao buscar horários disponíveis",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [selectedProfessional, selectedConvenio, toast]);

  const isDateAvailable = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isAvailable = availableDates.some(
      availableDate => {
        const availableString = `${availableDate.getFullYear()}-${String(availableDate.getMonth() + 1).padStart(2, '0')}-${String(availableDate.getDate()).padStart(2, '0')}`;
        return availableString === dateString;
      }
    );
    return isAvailable;
  };

  const getTimesForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const filteredHorarios = horarios.filter(horario => {
      const dateStr = horario.data.split(' ')[0];
      const [year, month, day] = dateStr.split('/');
      const horarioDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return (
        horarioDate.getDate() === selectedDate.getDate() &&
        horarioDate.getMonth() === selectedDate.getMonth() &&
        horarioDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    return filteredHorarios;
  };

  const handleSelectTime = (horario: HorarioDisponivel) => {
    setSelectedHorario(horario);
    setShowConfirmDialog(true);
  };

  const handleConfirmAgendamento = async () => {
    if (!selectedHorario || !selectedProfessional) return;

    try {
      setIsSubmitting(true);

      // Recuperar dados do localStorage
      const selectedPatientStr = localStorage.getItem("selectedPatientExam");
      const selectedProcedimentosStr = localStorage.getItem("selectedExamProcedimentos");
      const titularStr = localStorage.getItem("titular");

      if (!selectedPatientStr || !selectedProcedimentosStr || !titularStr) {
        toast({
          title: "Erro",
          description: "Dados do paciente ou exames não encontrados",
          variant: "destructive"
        });
        return;
      }

      const selectedPatient = JSON.parse(selectedPatientStr);
      const selectedProcedimentosIds = JSON.parse(selectedProcedimentosStr);
      const titular = JSON.parse(titularStr);

      const headers = getApiHeaders();
      const procedimentosResponse = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/buscarExamesNaoFeitosPedidosExames/${selectedPatient.id}`,
        {
          method: "GET",
          headers
        }
      );
      const procedimentosData = await procedimentosResponse.json();

      if (!procedimentosData.status || !procedimentosData.dados) {
        toast({
          title: "Erro",
          description: "Erro ao buscar detalhes dos exames",
          variant: "destructive"
        });
        return;
      }

      // Flatten all items e filtrar apenas os selecionados
      const allProcedimentos: any[] = [];
      procedimentosData.dados.forEach((pedido: any) => {
        if (pedido.items && Array.isArray(pedido.items)) {
          allProcedimentos.push(...pedido.items);
        }
      });

      const selectedProcedimentosCompletos = allProcedimentos.filter(proc =>
        selectedProcedimentosIds.includes(proc.id)
      );

      // Montar o payload
      const procedimentos = selectedProcedimentosCompletos.map(proc => ({
        NR_ATENDIMENTO: proc.NR_ATENDIMENTO || proc.nr_atendimento,
        CD_PESSOA_FISICA: selectedPatient.id.toString(),
        NR_SEQ_PEDIDO: proc.NR_SEQ_PEDIDO || parseInt(proc.nr_seq_pedido),
        NR_SEQ_PEDIDO_ITEM: proc.NR_SEQ_PEDIDO_ITEM,
        id: proc.id,
        CD_MEDICO: proc.CD_MEDICO,
        NM_MEDICO: proc.NM_MEDICO,
        DT_SOLICITACAO: proc.DT_SOLICITACAO,
        descricao: proc.descricao,
        DS_DADOS_CLINICOS: proc.DS_DADOS_CLINICOS,
        descricaoPreparo: proc.descricaoPreparo,
        examesAdicionais: ""
      }));

      const procedimentos2 = selectedProcedimentosCompletos.map(proc => ({
        nr_seq_proc_interno: proc.id,
        nr_seq_pedido: proc.NR_SEQ_PEDIDO || parseInt(proc.nr_seq_pedido)
      }));

      // Verificar se tem nr_seq_pedido válido
      const hasValidPedido = procedimentos2.some(p => p.nr_seq_pedido && !isNaN(p.nr_seq_pedido));

      const idEmpresa = selectedPatient.idEmpresa || 0;

      const payload = {
        idCliente: selectedPatient.id.toString(),
        idConvenio: parseInt(selectedConvenio),
        codigoCarteirinha: selectedPatient.codigoCarteirinha || "",
        idAgenda: selectedHorario.idAgenda,
        dataAgenda: selectedHorario.data,
        idEmpresa: idEmpresa,
        idMedico: selectedProfessional.id,
        procedimentos,
        procedimentos2,
        ie_pedido_externo: hasValidPedido ? "S" : "N"
      };

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ConfirmarAgendamento",
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        setSuccessMessage(data.mensagem);
        setShowConfirmDialog(false);
        setShowSuccessDialog(true);
      } else {
        toast({
          title: "Erro ao confirmar agendamento",
          description: data.mensagem || "Erro ao confirmar o agendamento",
          variant: "destructive"
        });
        setShowConfirmDialog(false);
      }
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar o agendamento",
        variant: "destructive"
      });
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timesForSelectedDate = getTimesForSelectedDate();

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Horários Disponíveis
              </h2>
              
              <Button
                variant="outline"
                onClick={() => navigate("/appointment-professionals")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione uma data e horário para o seu exame
            </p>

            {selectedProfessional && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Profissional: {selectedProfessional.nome}</p>
                <p className="text-sm text-muted-foreground">Especialidade: {selectedProfessional.dsEspecialidade}</p>
              </div>
            )}
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Carregando horários disponíveis...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selecione uma Data</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable(date) || date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={ptBR}
                    className="rounded-md border"
                    modifiers={{
                      available: availableDates
                    }}
                    modifiersClassNames={{
                      available: "bg-primary/20 text-primary font-semibold rounded-full"
                    }}
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg">
                      Horário Disponível
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {timesForSelectedDate.slice(0, 1).map((horario) => {
                      const timeStr = horario.data.split(' ')[1];
                      return (
                        <div key={horario.id} className="space-y-6">
                          <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="text-6xl font-bold text-primary">
                              {timeStr}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span className="text-sm font-medium">{horario.unidade.nome}</span>
                            </div>
                          </div>
                          
                          <Button
                            size="lg"
                            className="w-full text-base font-semibold"
                            onClick={() => handleSelectTime(horario)}
                          >
                            Agendar Exame
                          </Button>
                        </div>
                      );
                    })}
                    
                    {timesForSelectedDate.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          Nenhum horário disponível para esta data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {!selectedDate && (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                      Selecione uma data para ver os horários disponíveis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)]">
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Deseja confirmar o agendamento do exame com as seguintes informações?
            </DialogDescription>
          </DialogHeader>
          
          {selectedHorario && (
            <div className="space-y-3 py-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Data e Hora:</span>
                <p className="text-base font-semibold">{selectedHorario.data}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Unidade:</span>
                <p className="text-base font-semibold">{selectedHorario.unidade.nome}</p>
              </div>
              {selectedProfessional && (
                <>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Profissional:</span>
                    <p className="text-base font-semibold">{selectedProfessional.nome}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Especialidade:</span>
                    <p className="text-base font-semibold">{selectedProfessional.dsEspecialidade}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAgendamento}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)]">
          <DialogHeader>
            <DialogTitle>Agendamento Confirmado!</DialogTitle>
            <DialogDescription>
              {successMessage}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/");
              }}
            >
              Menu Principal
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/scheduled-appointments-choice");
              }}
            >
              Ver Agendamentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamTimes;
