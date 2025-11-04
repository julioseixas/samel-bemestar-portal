import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiHeaders } from "@/lib/api-headers";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HorarioDisponivel {
  id: number;
  idAgenda: number;
  horaEspecial: string;
  data: string;
  data2: string;
  especialidadeAgenda: {
    id: number;
    descricao: string;
  };
  idMedico: string;
  nmMedico: string;
  unidade: {
    id: number;
    nome: string;
  };
}

const AppointmentTimes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const { selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional } = location.state || {};

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

    if (!selectedPatient || !selectedConvenio || !selectedEspecialidade || !selectedProfissional) {
      navigate("/appointment-professionals");
    }
  }, [navigate, selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional]);

  useEffect(() => {
    if (selectedDate && horarios.length > 0) {
      const filteredHorarios = horarios.filter(horario => {
        const dateStr = horario.data2.split(' ')[0];
        const [day, month, year] = dateStr.split('/');
        const horarioDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        return (
          horarioDate.getDate() === selectedDate.getDate() &&
          horarioDate.getMonth() === selectedDate.getMonth() &&
          horarioDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      console.log('📅 Data selecionada:', format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
      console.log('⏰ Horários disponíveis:', filteredHorarios);
      console.log('📋 Total de horários:', filteredHorarios.length);
    }
  }, [selectedDate, horarios]);

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!selectedPatient || !selectedConvenio || !selectedEspecialidade || !selectedProfissional) {
        return;
      }

      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          idConvenio: selectedConvenio,
          idEspecialidade: selectedEspecialidade,
          idProfissional: selectedProfissional.id.toString(),
          idadeCliente: selectedPatient.idade?.toString() || "0",
          idCliente: selectedPatient.id?.toString() || ""
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarHorariosDisponiveis2?${params}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setHorarios(data.dados);
          
          // Extrair datas disponíveis
          const dates = data.dados.map((horario: HorarioDisponivel) => {
            // data2 está no formato "04/12/2025 11:24" (DD/MM/YYYY)
            const dateStr = horario.data2.split(' ')[0]; // Pegar apenas a parte da data
            const [day, month, year] = dateStr.split('/');
            const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            console.log('Parsing date from API:', horario.data2, '-> Date object:', parsedDate.toISOString());
            return parsedDate;
          });
          
          console.log('Available dates array:', dates.map(d => d.toISOString()));
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional]);

  const isDateAvailable = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isAvailable = availableDates.some(
      availableDate => {
        const availableString = `${availableDate.getFullYear()}-${String(availableDate.getMonth() + 1).padStart(2, '0')}-${String(availableDate.getDate()).padStart(2, '0')}`;
        return availableString === dateString;
      }
    );
    console.log('Checking date:', dateString, 'Available:', isAvailable, 'Total available dates:', availableDates.length);
    return isAvailable;
  };

  const getTimesForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const filteredHorarios = horarios.filter(horario => {
      const dateStr = horario.data2.split(' ')[0];
      const [day, month, year] = dateStr.split('/');
      const horarioDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return (
        horarioDate.getDate() === selectedDate.getDate() &&
        horarioDate.getMonth() === selectedDate.getMonth() &&
        horarioDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    console.log('Data selecionada:', format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
    console.log('Horários disponíveis para esta data:', JSON.stringify(filteredHorarios, null, 2));
    
    return filteredHorarios;
  };

  if (!selectedProfissional) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/appointment-professionals")}
              className="mb-3 sm:mb-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
              size="sm"
            >
              ← Voltar
            </Button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Horários Disponíveis
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
              {selectedProfissional.nomeDeGuerra || selectedProfissional.nome}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando horários disponíveis...</p>
            </div>
          ) : horarios.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Nenhum horário disponível encontrado para este profissional.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selecione uma Data</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable(date)}
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Horários - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[60vh]">
                      <div className="space-y-2 pr-4">
                        {getTimesForSelectedDate().map((horario) => {
                          const horarioTime = horario.data2.split(' ')[1]; // Extrai "HH:MM" de "DD/MM/YYYY HH:MM"
                          return (
                            <Button
                              key={horario.id}
                              variant="outline"
                              className="w-full justify-start text-left"
                              onClick={() => {
                                // TODO: Próximo passo - confirmar agendamento
                                console.log("Horário selecionado:", horario);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-semibold">{horarioTime}</div>
                                <div className="text-xs text-muted-foreground">
                                  {horario.unidade.nome}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentTimes;
