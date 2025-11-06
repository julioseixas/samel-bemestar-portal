import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getApiHeaders } from "@/lib/api-headers";

interface Patient {
  id: number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  idade?: number;
  cdPessoaFisica?: number;
}

interface Convenio {
  id: number;
  descricao: string;
  convenioSamel: string;
  agenda_exames_livre: string;
  imagem: string;
}

interface ProcedimentoItem {
  NR_ATENDIMENTO: number;
  CD_PESSOA_FISICA: string;
  NR_SEQ_PEDIDO: string;
  NR_SEQ_PEDIDO_ITEM: number;
  CD_MEDICO: string;
  DS_DADOS_CLINICOS: string | null;
  DT_SOLICITACAO: string;
  NM_MEDICO: string;
  descricao: string;
  descricaoPreparo: string;
  id: number;
  nm_medico: string;
  nr_atendimento: number;
  nr_seq_pedido: string;
}

interface Procedimento {
  nr_seq_pedido: string;
  nr_atendimento: number;
  ds_dados_clinicos: string | null;
  cd_medico: string;
  dt_solicitacao: string;
  items: ProcedimentoItem[];
}

const ExamDetails = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(true);
  const [selectedProcedimento, setSelectedProcedimento] = useState("");
  const [procedimentos, setProcedimentos] = useState<ProcedimentoItem[]>([]);
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatientExam");

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

    if (storedSelectedPatient) {
      try {
        const parsedPatient = JSON.parse(storedSelectedPatient);
        setSelectedPatient(parsedPatient);
      } catch (error) {
        console.error("Erro ao processar paciente selecionado:", error);
        navigate("/exam-schedule");
      }
    } else {
      navigate("/exam-schedule");
    }
  }, [navigate]);

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
    const fetchProcedimentos = async () => {
      if (!selectedPatient?.id) return;
      
      try {
        setLoadingProcedimentos(true);
        
        const headers = getApiHeaders();
        
        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/buscarExamesNaoFeitosPedidosExames/${selectedPatient.id}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.status && data.dados) {
          // Flatten all items from all pedidos
          const allItems: ProcedimentoItem[] = [];
          data.dados.forEach((pedido: Procedimento) => {
            if (pedido.items && Array.isArray(pedido.items)) {
              allItems.push(...pedido.items);
            }
          });
          setProcedimentos(allItems);
        }
      } catch (error) {
        console.error("Erro ao buscar procedimentos:", error);
      } finally {
        setLoadingProcedimentos(false);
      }
    };

    if (selectedConvenio) {
      fetchProcedimentos();
    }
  }, [selectedConvenio, selectedPatient]);

  const handleContinue = () => {
    if (!selectedConvenio) {
      alert("Por favor, selecione o convênio");
      return;
    }
    
    if (!selectedProcedimento) {
      alert("Por favor, selecione o procedimento");
      return;
    }
    
    // TODO: Navigate to exam scheduling
    console.log("Convênio selecionado:", selectedConvenio);
    console.log("Procedimento selecionado:", selectedProcedimento);
    console.log("Paciente:", selectedPatient);
  };

  if (!selectedPatient) {
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
              onClick={() => navigate("/exam-schedule")}
              className="mb-3 sm:mb-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
              size="sm"
            >
              ← Voltar
            </Button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Marcação de Exame
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
              Selecione o convênio para prosseguir com o agendamento
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
                <CardTitle className="text-base sm:text-lg">Detalhes do Exame</CardTitle>
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

                {selectedConvenio && (
                  <div className="space-y-2">
                    <Label htmlFor="procedimento">Procedimento</Label>
                    <Select 
                      value={selectedProcedimento} 
                      onValueChange={setSelectedProcedimento} 
                      disabled={loadingProcedimentos}
                    >
                      <SelectTrigger id="procedimento">
                        <SelectValue placeholder={loadingProcedimentos ? "Carregando..." : "Selecione o procedimento"} />
                      </SelectTrigger>
                      <SelectContent>
                        {procedimentos.map((procedimento) => (
                          <SelectItem key={procedimento.id} value={procedimento.id.toString()}>
                            {procedimento.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={handleContinue} 
                  className="mt-4 w-full"
                  disabled={!selectedConvenio || !selectedProcedimento}
                >
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamDetails;
