import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, ChevronsUpDown, X, Sparkles, CalendarDays, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Patient {
  id: string | number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  idade?: number;
  cdPessoaFisica?: string | number;
}

interface Convenio {
  id: number;
  descricao: string;
  convenioSamel: string;
  agenda_exames_livre: string;
  imagem: string;
}

interface Especialidade {
  id: number;
  descricao: string;
}

interface Encaminhamento {
  NR_SEQ_MED_AVALIACAO_PACIENTE: number;
  CD_PESSOA_FISICA_PACIENTE: string;
  CD_ESPECIALIDADE: number;
  CD_ESPECIALIDADE_AVALIACAO: string;
  CD_MEDICO: string;
  DS_DESCRICAO: string;
  DS_ESPECIALIDADE: string;
  DS_JUSTIFICATIVA: string;
  DS_OBSERVACAO: string;
  DT_AVALIACAO_DATE: string;
  DT_AVALIACAO_STRING: string;
  DT_LIBERACAO_DATE: string;
  DT_LIBERACAO_STRING: string;
  IE_FOI_AGENDADO: string;
  IE_PACIENTE_FOI_CONSULTADO: string;
  NM_MEDICO: string;
  NM_PACIENTE: string;
  NR_ATENDIMENTO: number;
  NR_SEQ_MED_AVALIACAO: number;
  NR_TELEFONE: string | null;
  descricao: string | null;
  id: number;
}

interface ConventionalFlowData {
  active: boolean;
  especialidades: Especialidade[];
  currentIndex: number;
  completedAppointments: any[];
  convenio: string;
}

const AppointmentDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [titular, setTitular] = useState<Patient | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<Especialidade[]>([]);
  const [especialidadeSearchOpen, setEspecialidadeSearchOpen] = useState(false);
  const [especialidadeSearchQuery, setEspecialidadeSearchQuery] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(true);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([]);
  const [useEncaminhamento, setUseEncaminhamento] = useState(false);
  const [selectedNrSeqMedAvaliacao, setSelectedNrSeqMedAvaliacao] = useState<number | null>(null);
  
  // Modal de escolha de fluxo
  const [showFlowChoiceModal, setShowFlowChoiceModal] = useState(false);
  
  // Fluxo convencional com múltiplas especialidades
  const [conventionalFlowActive, setConventionalFlowActive] = useState(false);
  const [conventionalFlowData, setConventionalFlowData] = useState<ConventionalFlowData | null>(null);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatient");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.nome || "Paciente");
        setTitular(parsedTitular);
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (storedSelectedPatient) {
      try {
        const parsedPatient = JSON.parse(storedSelectedPatient);
        
        setSelectedPatient(parsedPatient);
      } catch (error) {
        console.error("Erro ao processar paciente selecionado:", error);
        navigate("/appointment-schedule");
      }
    } else {
      navigate("/appointment-schedule");
    }

    // Verificar se existem encaminhamentos salvos
    const storedEncaminhamentos = localStorage.getItem("patientEncaminhamentos");
    if (storedEncaminhamentos) {
      try {
        const parsedEncaminhamentos = JSON.parse(storedEncaminhamentos);
        
        // Filtrar duplicatas por id como medida de segurança
        const encaminhamentosUnicos = parsedEncaminhamentos.reduce((acc: Encaminhamento[], current: Encaminhamento) => {
          const existe = acc.find(item => item.id === current.id);
          if (!existe) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setEncaminhamentos(encaminhamentosUnicos);
      } catch (error) {
        console.error("Erro ao processar encaminhamentos:", error);
      }
    }
    
    // Verificar se há fluxo convencional ativo
    const storedConventionalFlow = localStorage.getItem("conventionalFlow");
    if (storedConventionalFlow) {
      try {
        const flowData: ConventionalFlowData = JSON.parse(storedConventionalFlow);
        if (flowData.active) {
          setConventionalFlowActive(true);
          setConventionalFlowData(flowData);
          setSelectedConvenio(flowData.convenio);
          
          // Se veio da tela de sucesso (continuar agendamento), avançar para próxima especialidade
          if (location.state?.continueFlow) {
            const nextIndex = flowData.currentIndex + 1;
            if (nextIndex < flowData.especialidades.length) {
              // Atualizar índice e continuar
              const updatedFlowData = { 
                ...flowData, 
                currentIndex: nextIndex,
                completedAppointments: [...flowData.completedAppointments, location.state?.lastAppointment]
              };
              localStorage.setItem("conventionalFlow", JSON.stringify(updatedFlowData));
              setConventionalFlowData(updatedFlowData);
              
              // Agendar próxima especialidade automaticamente
              setTimeout(() => {
                proceedWithSingleSpecialty(flowData.especialidades[nextIndex]);
              }, 500);
            } else {
              // Fluxo completo - mostrar resumo
              localStorage.removeItem("conventionalFlow");
              setConventionalFlowActive(false);
              setConventionalFlowData(null);
              toast({
                title: "Agendamentos concluídos!",
                description: `Todas as ${flowData.especialidades.length} consultas foram agendadas com sucesso.`
              });
              navigate("/scheduled-appointments-choice");
            }
          }
        }
      } catch (error) {
        console.error("Erro ao processar fluxo convencional:", error);
        localStorage.removeItem("conventionalFlow");
      }
    }
  }, [navigate, location.state]);

  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        setLoadingConvenios(true);
        
        const headers = getApiHeaders();
        
        const response = await fetch(
          'https://api-portalpaciente-web.samel.com.br/api/Convenio/ListarConvenios',
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setConvenios(data.dados);
          
          // Verificar se existe convênio com id 19 e selecionar automaticamente
          const convenioSamel = data.dados.find((convenio: Convenio) => convenio.id === 19);
          if (convenioSamel) {
            setSelectedConvenio("19");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar convênios:", error);
      } finally {
        setLoadingConvenios(false);
      }
    };

    fetchConvenios();
  }, []);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      // Se usar encaminhamento, não buscar especialidades normais
      if (useEncaminhamento) {
        return;
      }

      if (!selectedConvenio || !selectedPatient) {
        return;
      }

      if (!selectedPatient.codigoCarteirinha || selectedPatient.codigoCarteirinha.trim() === '') {
        console.error("ERRO: Paciente sem código de carteirinha válido");
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "Paciente sem plano de saúde ativo. Retornando à seleção de pacientes."
        });
        navigate("/appointment-schedule");
        return;
      }

      try {
        setLoadingEspecialidades(true);
        setEspecialidades([]);
        setSelectedEspecialidades([]);

      // cdPessoaFisica deve ser do paciente selecionado (titular ou dependente)
      const cdPessoaFisica = selectedPatient.cdPessoaFisica?.toString() || "";
      
      // cdDependente deve SEMPRE ser o ID do paciente selecionado
      const cdDependente = selectedPatient.id?.toString() || "";
        
      const nrCarteirinha = selectedPatient.codigoCarteirinha?.toString() || "";
      
      const params = new URLSearchParams({
          idConvenio: selectedConvenio,
          idadeCliente: selectedPatient.idade?.toString() || "0",
          cdPessoaFisica,
          sexo: selectedPatient.sexo || "",
          descricaoEspecialidade: "",
          cdDependente: cdDependente,
          nrCarteirinha: nrCarteirinha
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarEspecialidadesComAgendaDisponivel3?${params}`,
          {
            method: "GET",
            headers: headers
        }
      );
      const data = await response.json();
      
      if (data.sucesso && data.dados) {
          setEspecialidades(data.dados);
        } else {
          console.error("Erro ao buscar especialidades:", data.mensagem);
        }
      } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
      } finally {
        setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, [selectedConvenio, selectedPatient, useEncaminhamento]);

  // Reset especialidade quando trocar o modo de encaminhamento
  useEffect(() => {
    setSelectedEspecialidades([]);
  }, [useEncaminhamento]);

  // Função para gerar profissionais mockados
  const generateMockProfessionals = (especialidade: Especialidade) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const mockProfessionals = [
      {
        idAgenda: 90001,
        dataAgenda: today.toISOString(),
        dataAgenda2: `${formatDate(today)} 08:00`,
        id: "MOCK001",
        nome: "DR. TESTE INTELIGENTE 1",
        dsEspecialidade: especialidade.descricao,
        dsComplemento: null,
        ieSexo: "M",
        ie_sigla_conselho: "CRM",
        nr_conselho: "12345",
        idsProcedimentos: [],
        unidade: {
          id: "1",
          descricao: "HOSPITAL SAMEL - ADRIANÓPOLIS",
          logradouro: "Av. Mário Ypiranga",
          numeroLogradouro: "1400",
          bairro: "Adrianópolis"
        }
      },
      {
        idAgenda: 90002,
        dataAgenda: tomorrow.toISOString(),
        dataAgenda2: `${formatDate(tomorrow)} 09:00`,
        id: "MOCK002",
        nome: "DRA. TESTE INTELIGENTE 2",
        dsEspecialidade: especialidade.descricao,
        dsComplemento: null,
        ieSexo: "F",
        ie_sigla_conselho: "CRM",
        nr_conselho: "67890",
        idsProcedimentos: [],
        unidade: {
          id: "1",
          descricao: "HOSPITAL SAMEL - ADRIANÓPOLIS",
          logradouro: "Av. Mário Ypiranga",
          numeroLogradouro: "1400",
          bairro: "Adrianópolis"
        }
      }
    ];

    return [{
      combinacao: "",
      dados: mockProfessionals
    }];
  };

  const proceedWithSingleSpecialty = async (especialidade: Especialidade) => {
    if (!selectedPatient) return;
    
    const selectedEspecialidade = especialidade.id.toString();

    // Verificar se é modo de teste (especialidade mockada)
    const isTestMode = especialidade.descricao.includes("TESTE INTELIGENTE");
    
    if (isTestMode) {
      const mockProfessionalsGroups = generateMockProfessionals(especialidade);
      
      localStorage.setItem("appointmentProfessionals", JSON.stringify(mockProfessionalsGroups));
      localStorage.setItem("selectedAppointmentConvenio", selectedConvenio);
      localStorage.setItem("selectedAppointmentEspecialidade", selectedEspecialidade);
      localStorage.setItem("appointmentUseEncaminhamento", JSON.stringify(useEncaminhamento));
      localStorage.setItem("selectedNrSeqMedAvaliacao", JSON.stringify(selectedNrSeqMedAvaliacao));
      localStorage.setItem("appointmentTestMode", "true");
      
      navigate("/appointment-professionals");
      return;
    }

    // Limpar modo de teste
    localStorage.removeItem("appointmentTestMode");

    try {
      const idCliente = selectedPatient.cdPessoaFisica?.toString() || "";
      const idadeCliente = selectedPatient.idade?.toString() || "0";
      const sexo = selectedPatient.sexo || "";
      const cdDependente = selectedPatient.id?.toString() || "";
      const nrCarteirinha = selectedPatient.codigoCarteirinha?.toString() || "";
      
      const headers = getApiHeaders();

      const params = new URLSearchParams({
        idConvenio: selectedConvenio,
        idadeCliente,
        idEspecialidade: selectedEspecialidade,
        nomeProfissional: "",
        idCliente,
        sexo,
        cdDependente,
        nrCarteirinha
      });

      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel3?${params}`,
        {
          method: "GET",
          headers
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        if (data.dados.length === 0) {
          toast({
            variant: "destructive",
            title: "Nenhum profissional disponível",
            description: `Não há profissionais disponíveis para ${especialidade.descricao} no momento.`
          });
          return;
        }

        const dsEspecialidade = especialidade.descricao;
        
        const filtrarAgendasMaisAntigas = (arr: any[]) => {
          const finalList: any[] = [];
          for (let i = 0; i < arr.length; i++) {
            const atual = arr[i];
            let existe = false;
            for (let j = 0; j < finalList.length; j++) {
              if (finalList[j].idAgenda === atual.idAgenda) {
                if (new Date(atual.dataAgenda2) < new Date(finalList[j].dataAgenda2)) {
                  finalList[j] = atual;
                }
                existe = true;
              }
            }
            if (!existe) {
              finalList.push(atual);
            }
          }
          return finalList;
        };

        const profissionaisFiltrados = filtrarAgendasMaisAntigas(data.dados);
        
        const profissionaisGroups = [{
          combinacao: "",
          dados: profissionaisFiltrados.map((prof: any) => ({
            idAgenda: prof.idAgenda,
            dataAgenda: prof.dataAgenda,
            dataAgenda2: prof.dataAgenda2,
            id: prof.id.toString(),
            nome: prof.nome,
            dsEspecialidade: dsEspecialidade,
            dsComplemento: prof.dsComplemento || null,
            ieSexo: prof.ieSexo,
            ie_sigla_conselho: prof.ieSiglaConselho,
            nr_conselho: prof.nrConselho,
            idsProcedimentos: [],
            unidade: {
              id: prof.unidade.id.toString(),
              descricao: prof.unidade.descricao,
              logradouro: prof.unidade.logradouro,
              numeroLogradouro: prof.unidade.numeroLogradouro?.toString(),
              bairro: prof.unidade.bairro
            }
          }))
        }];
        
        localStorage.setItem("appointmentProfessionals", JSON.stringify(profissionaisGroups));
        localStorage.setItem("selectedAppointmentConvenio", selectedConvenio);
        localStorage.setItem("selectedAppointmentEspecialidade", selectedEspecialidade);
        localStorage.setItem("appointmentUseEncaminhamento", JSON.stringify(useEncaminhamento));
        localStorage.setItem("selectedNrSeqMedAvaliacao", JSON.stringify(selectedNrSeqMedAvaliacao));
        
        navigate("/appointment-professionals");
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || "Nenhum profissional disponível encontrado"
        });
      }
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar profissionais disponíveis"
      });
    }
  };

  const handleConventionalFlow = () => {
    setShowFlowChoiceModal(false);
    
    // Salvar estado do fluxo convencional
    const flowData: ConventionalFlowData = {
      active: true,
      especialidades: selectedEspecialidades,
      currentIndex: 0,
      completedAppointments: [],
      convenio: selectedConvenio
    };
    localStorage.setItem("conventionalFlow", JSON.stringify(flowData));
    setConventionalFlowActive(true);
    setConventionalFlowData(flowData);
    
    // Iniciar com primeira especialidade
    proceedWithSingleSpecialty(selectedEspecialidades[0]);
  };

  const handleSmartFlow = () => {
    setShowFlowChoiceModal(false);
    localStorage.removeItem("conventionalFlow");
    
    localStorage.setItem("smartSchedulingEspecialidades", JSON.stringify(selectedEspecialidades));
    localStorage.setItem("smartSchedulingConvenio", selectedConvenio);
    navigate("/smart-scheduling", { 
      state: { 
        fromAppointmentDetails: true,
        especialidades: selectedEspecialidades,
        convenio: selectedConvenio
      } 
    });
  };

  const handleCancelConventionalFlow = () => {
    localStorage.removeItem("conventionalFlow");
    setConventionalFlowActive(false);
    setConventionalFlowData(null);
    setSelectedEspecialidades([]);
  };

  const handleContinue = async () => {
    if (!selectedConvenio || selectedEspecialidades.length === 0) {
      alert("Por favor, selecione o convênio e pelo menos uma especialidade");
      return;
    }

    if (!selectedPatient) {
      alert("Dados do paciente não encontrados");
      return;
    }

    // Se tiver 2 ou mais especialidades, mostrar modal de escolha
    if (selectedEspecialidades.length >= 2) {
      setShowFlowChoiceModal(true);
      return;
    }

    // Fluxo normal para 1 especialidade
    await proceedWithSingleSpecialty(selectedEspecialidades[0]);
  };

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      {/* Indicador de fluxo convencional ativo (simplificado) */}
      {conventionalFlowActive && conventionalFlowData && (
        <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Fluxo em andamento
              </Badge>
              <span className="text-sm text-muted-foreground">
                {conventionalFlowData.especialidades.length} especialidades
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancelConventionalFlow}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Consulta
              </h2>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (conventionalFlowActive) {
                    handleCancelConventionalFlow();
                  }
                  const listToSchedule = localStorage.getItem("listToSchedule");
                  if (listToSchedule) {
                    try {
                      const listAllPacient = JSON.parse(listToSchedule);
                      const hasDependents = listAllPacient.length > 1;
                      navigate(hasDependents ? "/appointment-schedule" : "/dashboard");
                    } catch (error) {
                      console.error("Erro ao verificar dependentes:", error);
                      navigate("/dashboard");
                    }
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione o convênio e a especialidade para a consulta
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Paciente Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Nome:</span>
                  <p className="text-base sm:text-lg font-semibold">{selectedPatient.nome}</p>
                </div>
                {selectedPatient.codigoCarteirinha && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Código da Carteirinha:</span>
                    <p className="text-base sm:text-lg font-semibold">{selectedPatient.codigoCarteirinha}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge variant={selectedPatient.tipo === "Titular" ? "default" : "secondary"}>
                    {selectedPatient.tipo}
                  </Badge>
                  {selectedPatient.sexo && (
                    <Badge variant="outline">
                      {selectedPatient.sexo?.toUpperCase() === 'M' ? 'Masculino' : 'Feminino'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Detalhes da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Select value={selectedConvenio} onValueChange={setSelectedConvenio} disabled={loadingConvenios}>
                    <SelectTrigger id="convenio">
                      <SelectValue placeholder={loadingConvenios ? "Carregando..." : "Selecione o convênio"} />
                    </SelectTrigger>
                    <SelectContent>
                      {convenios.map((convenio) => (
                        <SelectItem key={convenio.id} value={convenio.id.toString()}>
                          <div className="flex items-center gap-2">
                            {convenio.imagem && (
                              <img 
                                src={`data:image/png;base64,${convenio.imagem}`} 
                                alt={convenio.descricao}
                                className="h-6 w-6 object-contain"
                              />
                            )}
                            <span>{convenio.descricao}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {encaminhamentos.length > 0 && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/30">
                    <Checkbox 
                      id="encaminhamento" 
                      checked={useEncaminhamento}
                      onCheckedChange={(checked) => {
                        setUseEncaminhamento(checked === true);
                        if (!checked) {
                          setSelectedNrSeqMedAvaliacao(null);
                        }
                      }}
                    />
                    <Label 
                      htmlFor="encaminhamento" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Agendar por encaminhamento médico
                    </Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="especialidade">
                    {useEncaminhamento ? "Encaminhamento" : "Especialidade(s)"}
                  </Label>
                  {useEncaminhamento ? (
                    <Select 
                      value={selectedNrSeqMedAvaliacao?.toString() || ""} 
                      onValueChange={(value) => {
                        const nrSeqMedAvaliacao = parseInt(value);
                        setSelectedNrSeqMedAvaliacao(nrSeqMedAvaliacao);
                        
                        // Buscar o encaminhamento completo para extrair CD_ESPECIALIDADE
                        const encaminhamento = encaminhamentos.find(
                          enc => enc.NR_SEQ_MED_AVALIACAO_PACIENTE === nrSeqMedAvaliacao
                        );
                        if (encaminhamento) {
                          const esp = especialidades.find(e => e.id === encaminhamento.CD_ESPECIALIDADE);
                          if (esp) {
                            setSelectedEspecialidades([esp]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="especialidade">
                        <SelectValue placeholder="Selecione o encaminhamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {encaminhamentos.map((encaminhamento) => (
                          <SelectItem 
                            key={encaminhamento.id} 
                            value={encaminhamento.NR_SEQ_MED_AVALIACAO_PACIENTE.toString()}
                          >
                            {encaminhamento.descricao || encaminhamento.DS_ESPECIALIDADE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-3">
                      {/* Especialidades selecionadas */}
                      {selectedEspecialidades.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedEspecialidades.map((esp) => (
                            <Badge 
                              key={esp.id} 
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              {esp.descricao}
                              <button
                                type="button"
                                onClick={() => setSelectedEspecialidades(
                                  selectedEspecialidades.filter(e => e.id !== esp.id)
                                )}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Botão para adicionar especialidade */}
                      <Popover open={especialidadeSearchOpen} onOpenChange={setEspecialidadeSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={especialidadeSearchOpen}
                            className="w-full justify-between"
                            disabled={!selectedConvenio || loadingEspecialidades}
                          >
                            {loadingEspecialidades 
                              ? "Carregando..." 
                              : !selectedConvenio 
                                ? "Selecione um convênio primeiro"
                                : selectedEspecialidades.length === 0
                                  ? "Selecione a especialidade"
                                  : "Adicionar outra especialidade"}
                            {selectedEspecialidades.length === 0 ? (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            ) : (
                              <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar especialidade..." 
                              value={especialidadeSearchQuery}
                              onValueChange={setEspecialidadeSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                              <CommandGroup>
                                {especialidades
                                  .filter(e => 
                                    !selectedEspecialidades.find(s => s.id === e.id) &&
                                    e.descricao.toLowerCase().includes(especialidadeSearchQuery.toLowerCase())
                                  )
                                  .map((especialidade) => (
                                    <CommandItem
                                      key={especialidade.id}
                                      value={especialidade.descricao}
                                      onSelect={() => {
                                        setSelectedEspecialidades([...selectedEspecialidades, especialidade]);
                                        setEspecialidadeSearchOpen(false);
                                        setEspecialidadeSearchQuery("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedEspecialidades.find(s => s.id === especialidade.id) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {especialidade.descricao}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {selectedEspecialidades.length >= 2 && (
                        <p className="text-xs text-muted-foreground">
                          Com {selectedEspecialidades.length} especialidades, você poderá escolher o fluxo de agendamento.
                        </p>
                      )}

                      {/* Botão de teste */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-dashed border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={() => {
                          const mockEspecialidades: Especialidade[] = [
                            { id: 99901, descricao: "TESTE INTELIGENTE 1" },
                            { id: 99902, descricao: "TESTE INTELIGENTE 2" }
                          ];
                          setSelectedEspecialidades(mockEspecialidades);
                        }}
                      >
                        🧪 Testar com Dados Mock
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Button 
                    onClick={handleContinue} 
                    className="w-full"
                    disabled={!selectedConvenio || selectedEspecialidades.length === 0 || conventionalFlowActive}
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de escolha de fluxo */}
      <Dialog open={showFlowChoiceModal} onOpenChange={setShowFlowChoiceModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Como deseja agendar suas consultas?</DialogTitle>
            <DialogDescription>
              Você selecionou {selectedEspecialidades.length} especialidades. 
              Escolha como deseja prosseguir com o agendamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Opção 1: Agendamento Convencional */}
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={handleConventionalFlow}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Agendar uma por vez
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Escolha profissional, unidade e horário para cada especialidade 
                  separadamente. Você terá mais controle sobre cada agendamento.
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span>Uma barra de progresso irá guiá-lo pelo processo</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Opção 2: Agendamento Inteligente */}
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={handleSmartFlow}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Agendamento Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Encontramos automaticamente horários compatíveis para todas as 
                  especialidades no mesmo dia e unidade, com intervalos adequados 
                  entre consultas.
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span>Ideal para quem quer otimizar tempo</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentDetails;
