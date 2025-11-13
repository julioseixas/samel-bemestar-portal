import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  idade?: number;
  cdPessoaFisica?: number;
  idEmpresa?: number;
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
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(true);
  const [selectedProcedimentos, setSelectedProcedimentos] = useState<number[]>([]);
  const [procedimentos, setProcedimentos] = useState<ProcedimentoItem[]>([]);
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleProcedimentoToggle = (procedimentoId: number) => {
    setSelectedProcedimentos(prev => {
      if (prev.includes(procedimentoId)) {
        return prev.filter(id => id !== procedimentoId);
      } else {
        return [...prev, procedimentoId];
      }
    });
  };

  const filteredProcedimentos = procedimentos.filter(procedimento =>
    procedimento.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = async () => {
    if (!selectedConvenio) {
      alert("Por favor, selecione o convênio");
      return;
    }
    
    if (selectedProcedimentos.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione pelo menos um exame"
      });
      return;
    }
    
    try {
      const headers = getApiHeaders();
      
      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ListarProfissionaisComAgendaDisponivelParaProcedimentos2',
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            idConvenio: parseInt(selectedConvenio),
            idadeCliente: selectedPatient?.idade || 0,
            idProcedimentos: selectedProcedimentos
          })
        }
      );
      
      const data = await response.json();
      
      if (data.sucesso && data.dados) {
        let normalizedData = data.dados;
        
        // Se data.dados não é um array, transforma em array
        if (!Array.isArray(data.dados)) {
          normalizedData = [data.dados];
        }
        
        // Verifica se cada item do array tem a estrutura correta
        normalizedData = normalizedData.map((item: any) => {
          // Se o item não tem a propriedade 'dados', pode ser que seja um profissional direto
          if (!item.dados && item.idAgenda) {
            // É um profissional direto, precisa wrappear
            return {
              combinacao: item.dsEspecialidade || "Exame",
              dados: [item]
            };
          }
          return item;
        });
        
        localStorage.setItem("examProfessionals", JSON.stringify(normalizedData));
        localStorage.setItem("selectedExamProcedimentos", JSON.stringify(selectedProcedimentos));
        localStorage.setItem("selectedExamConvenio", selectedConvenio);
        
        navigate("/exam-professionals");
      } else {
        console.error("Erro na resposta da API:", data);
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || "Erro ao buscar profissionais disponíveis"
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

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Exame
              </h2>
              
              <Button
                variant="outline"
                onClick={() => navigate("/exam-schedule")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
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
                  <div className="space-y-3">
                    <div>
                      <Label>Exames Disponíveis</Label>
                      {procedimentos.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {procedimentos.length} exame(s) disponível(is)
                        </p>
                      )}
                    </div>
                    
                    {loadingProcedimentos ? (
                      <p className="text-sm text-muted-foreground">Carregando exames...</p>
                    ) : procedimentos.length > 0 ? (
                      <>
                        <Input
                          type="text"
                          placeholder="Pesquisar exames..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                        <div className="space-y-3 h-[300px] overflow-y-auto border rounded-md p-3">
                          {filteredProcedimentos.length > 0 ? (
                            filteredProcedimentos.map((procedimento) => (
                              <div key={procedimento.id} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`procedimento-${procedimento.id}`}
                                  checked={selectedProcedimentos.includes(procedimento.id)}
                                  onCheckedChange={() => handleProcedimentoToggle(procedimento.id)}
                                />
                                <label
                                  htmlFor={`procedimento-${procedimento.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  {procedimento.descricao}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum exame encontrado com "{searchTerm}"
                            </p>
                          )}
                        </div>
                        {selectedProcedimentos.length > 0 && (
                          <p className="text-sm font-medium text-primary">
                            {selectedProcedimentos.length} exame(s) selecionado(s)
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum exame disponível</p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleContinue} 
                  className="mt-4 w-full"
                  disabled={!selectedConvenio || selectedProcedimentos.length === 0}
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
