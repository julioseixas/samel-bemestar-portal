import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiHeaders } from "@/lib/api-headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

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

        console.log("Chamando API com parâmetros:", params.toString());

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ListarHorariosDisponiveisParaProcedimentos3?${params}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        console.log("Resposta da API:", data);
        
        if (data.sucesso && data.dados) {
          setHorarios(data.dados);
          
          // Extrair datas disponíveis
          // A data está no formato "dd/mm/yyyy hr24:mi:ss"
          const dates = data.dados.map((horario: HorarioDisponivel) => {
            const dateStr = horario.data.split(' ')[0]; // Pegar apenas a parte da data
            const [day, month, year] = dateStr.split('/');
            const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            console.log('Parsing date from API:', horario.data, '-> Date object:', parsedDate.toISOString());
            return parsedDate;
          });
          
          console.log('Available dates array:', dates.map(d => d.toISOString()));
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
      const [day, month, year] = dateStr.split('/');
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
    console.log("Horário selecionado:", horario);
    toast({
      title: "Horário selecionado",
      description: `Data: ${horario.data} - Unidade: ${horario.unidade.nome}`
    });
    // TODO: Implementar fluxo de confirmação do agendamento
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
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate
                      ? `Horários para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                      : "Selecione uma data"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-center text-muted-foreground py-8">
                      Selecione uma data para ver os horários disponíveis
                    </p>
                  ) : timesForSelectedDate.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum horário disponível para esta data
                    </p>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {timesForSelectedDate.map((horario) => {
                          const timeStr = horario.data.split(' ')[1]; // Pegar a hora
                          return (
                            <Button
                              key={horario.id}
                              variant="outline"
                              className="w-full justify-between hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handleSelectTime(horario)}
                            >
                              <span className="font-semibold">{timeStr}</span>
                              <span className="text-sm text-muted-foreground">
                                {horario.unidade.nome}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamTimes;
