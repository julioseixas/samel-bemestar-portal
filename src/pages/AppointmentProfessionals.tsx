import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Stethoscope } from "lucide-react";

interface Unidade {
  id: string;
  descricao: string;
  logradouro: string;
  numeroLogradouro?: string;
  bairro?: string;
}

interface Profissional {
  idAgenda: number;
  dataAgenda: string;
  id: string;
  nome: string;
  dsEspecialidade: string;
  ieSexo: string;
  ie_sigla_conselho: string;
  nr_conselho: string;
  idsProcedimentos: number[];
  unidade: Unidade;
}

interface ProfissionalGroup {
  combinacao: string;
  dados: Profissional[];
}

const AppointmentProfessionals = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profissionaisGroups, setProfissionaisGroups] = useState<ProfissionalGroup[]>([]);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedAppointmentProfessionals = localStorage.getItem("appointmentProfessionals");

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

    // Carregar apenas dados de consulta
    const storedProfessionals = storedAppointmentProfessionals;

    if (storedProfessionals) {
      try {
        const parsedProfessionals = JSON.parse(storedProfessionals);
        
        setProfissionaisGroups(parsedProfessionals);
      } catch (error) {
        console.error("Erro ao processar profissionais:", error);
        navigate("/appointment-details");
      }
    } else {
      const selectedAppointmentConvenio = localStorage.getItem("selectedAppointmentConvenio");
      const selectedExamConvenio = localStorage.getItem("selectedExamConvenio");

      if (selectedAppointmentConvenio) {
        navigate("/appointment-details");
      } else if (selectedExamConvenio) {
        navigate("/exam-professionals");
      } else {
        navigate("/appointment-schedule");
      }
    }
  }, [navigate]);

  const getAvatarColor = (sexo: string) => {
    const sexoNormalizado = sexo?.trim().toUpperCase();
    return sexoNormalizado === 'F' 
      ? "bg-pink-100 dark:bg-pink-900/30" 
      : "bg-blue-100 dark:bg-blue-900/30";
  };

  const formatEndereco = (unidade: Unidade) => {
    const parts = [unidade.logradouro];
    if (unidade.numeroLogradouro) parts.push(unidade.numeroLogradouro);
    if (unidade.bairro) parts.push(unidade.bairro);
    return parts.join(", ");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Profissionais Disponíveis
              </h2>
              
              <Button
                variant="outline"
                onClick={() => navigate("/appointment-details")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione um profissional para continuar o agendamento
            </p>
          </div>

          {profissionaisGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Nenhum profissional disponível encontrado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profissionaisGroups.flatMap((group) => {
                if (!group.dados || !Array.isArray(group.dados) || group.dados.length === 0) {
                  return [];
                }
                
                return group.dados.map((profissional) => {
                  const handleSelectProfessional = () => {
                    const selectedConvenio = localStorage.getItem("selectedAppointmentConvenio");
                    const selectedEspecialidade = localStorage.getItem("selectedAppointmentEspecialidade");
                    const storedPatient = localStorage.getItem("selectedPatient");
                    
                    if (!selectedConvenio) {
                      console.error("ID do convênio de consulta não encontrado");
                      return;
                    }
                    
                    if (!selectedEspecialidade) {
                      console.error("ID da especialidade não encontrado");
                      return;
                    }
                    
                    let selectedPatient = null;
                    if (storedPatient) {
                      try {
                        selectedPatient = JSON.parse(storedPatient);
                      } catch (error) {
                        console.error("Erro ao recuperar paciente:", error);
                        return;
                      }
                    } else {
                      console.error("Paciente não encontrado");
                      return;
                    }
                    
                    navigate("/appointment-times", {
                      state: {
                        selectedPatient,
                        selectedConvenio,
                        selectedEspecialidade,
                        selectedProfissional: profissional
                      }
                    });
                  };
                  
                  return (
                      <Card 
                        key={profissional.idAgenda} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={handleSelectProfessional}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${getAvatarColor(profissional.ieSexo)}`}>
                              <Stethoscope className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base sm:text-lg">
                                {profissional.nome}
                              </CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {profissional.ie_sigla_conselho} {profissional.nr_conselho}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {group.combinacao && (
                            <div>
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Exames que realiza:
                              </span>
                              <div className="mt-1 max-h-24 overflow-y-auto border rounded-md p-2 bg-muted/30">
                                <p className="text-xs sm:text-sm leading-relaxed">
                                  {group.combinacao}
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Especialidade:
                            </span>
                            <p className="text-sm sm:text-base font-semibold">
                              {profissional.dsEspecialidade}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Disponível a partir de:
                            </span>
                            <p className="text-sm sm:text-base font-semibold">
                              {profissional.dataAgenda}
                            </p>
                          </div>
                          {Object.keys(profissional.unidade || {}).length > 0 ? (
                            <>
                              <div>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                  Consulta Presencial
                                </Badge>
                              </div>
                              <div>
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  Unidade:
                                </span>
                                <p className="text-sm sm:text-base font-semibold">
                                  {profissional.unidade.descricao}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  Endereço:
                                </span>
                                <p className="text-sm sm:text-base">
                                  {formatEndereco(profissional.unidade)}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div>
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                                Consulta por Telemedicina
                              </Badge>
                            </div>
                          )}
                  </CardContent>
                </Card>
                  );
                });
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentProfessionals;
