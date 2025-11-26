import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";

interface AvaliacaoResponse {
  status: string;
  message: string;
  dados: {
    status: boolean;
    dados: {
      enviadas: AvaliacaoPendente[];
      pendentes: AvaliacaoPendente[];
    };
  };
}

interface AvaliacaoPendente {
  nr_atendimento: number;
  nm_medico: string;
  dados: {
    DS_LOCAL: string;
    DT_ENTRADA: string;
  };
}

interface PerguntaSatisfacao {
  CD_CODIGO: string;
  DS_OBSERVACAO: string;
  DS_PERGUNTA: string;
  NR_SEQUENCIA: number;
  TIPO: string;
}

interface PerguntasResponse {
  dados: PerguntaSatisfacao[];
  msg: string;
  qtdPerguntas: number;
  status: boolean;
}

const RateAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AvaliacaoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AvaliacaoPendente | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaSatisfacao[]>([]);
  const [respostas, setRespostas] = useState<{ [key: number]: number }>({});
  const [comentario, setComentario] = useState("");
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [hoveredStars, setHoveredStars] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }

    fetchPendingEvaluations();
  }, []);

  const fetchPendingEvaluations = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      
      if (!userToken) {
        setLoading(false);
        return;
      }

      const decoded: any = jwtDecode(userToken);
      
      const pacientesIds: number[] = [parseInt(decoded.id)];
      
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) pacientesIds.push(parseInt(dep.id));
        });
      }

      const allPendingEvaluations: AvaliacaoPendente[] = [];
      
      for (const id of pacientesIds) {
        try {
          const response = await fetch(
            `https://appv2-back.samel.com.br/api/atendimento/listarUltimasRespostas/${id}`,
            {
              method: "GET",
              headers: getApiHeaders(),
            }
          );

          const data: AvaliacaoResponse = await response.json();
          
          if (data.dados?.dados?.pendentes && Array.isArray(data.dados.dados.pendentes)) {
            allPendingEvaluations.push(...data.dados.dados.pendentes);
          }
        } catch (error) {
          console.error(`Erro ao buscar avaliações para o ID ${id}:`, error);
        }
      }

      setAppointments(allPendingEvaluations);
    } catch (error) {
      console.error("Erro ao buscar avaliações pendentes:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar suas avaliações pendentes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (avaliacao: AvaliacaoPendente) => {
    setSelectedAppointment(avaliacao);
    setLoadingPerguntas(true);
    
    try {
      const response = await fetch(
        `https://appv2-back.samel.com.br/api/atendimento/buscarPerguntasDeSatisfacao/${avaliacao.nr_atendimento}`,
        {
          method: "GET",
          headers: getApiHeaders(),
        }
      );

      const data: PerguntasResponse = await response.json();
      
      if (data.status && data.dados) {
        setPerguntas(data.dados);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.msg || "Não foi possível carregar as perguntas.",
        });
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as perguntas de satisfação.",
      });
      setSelectedAppointment(null);
    } finally {
      setLoadingPerguntas(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
    setPerguntas([]);
    setRespostas({});
    setComentario("");
    setHoveredStars({});
  };

  const handleStarClick = (perguntaSeq: number, estrelas: number) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaSeq]: estrelas,
    }));
  };

  const handleStarHover = (perguntaSeq: number, estrelas: number) => {
    setHoveredStars(prev => ({
      ...prev,
      [perguntaSeq]: estrelas,
    }));
  };

  const handleStarLeave = (perguntaSeq: number) => {
    setHoveredStars(prev => ({
      ...prev,
      [perguntaSeq]: 0,
    }));
  };

  const handleSubmitAvaliacao = () => {
    const todasRespondidas = perguntas.every(p => respostas[p.NR_SEQUENCIA] > 0);
    
    if (!todasRespondidas) {
      toast({
        variant: "destructive",
        title: "Avaliação incompleta",
        description: "Por favor, responda todas as perguntas.",
      });
      return;
    }

    toast({
      title: "Avaliação enviada!",
      description: "Obrigado pelo seu feedback!",
    });

    handleCloseModal();
  };

  const renderStars = (pergunta: PerguntaSatisfacao) => {
    const perguntaSeq = pergunta.NR_SEQUENCIA;
    const currentRating = respostas[perguntaSeq] || 0;
    const hoverRating = hoveredStars[perguntaSeq] || 0;
    const displayRating = hoverRating || currentRating;
    
    const maxStars = pergunta.CD_CODIGO === "Q1" ? 10 : 5;
    const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

    return (
      <div className="flex gap-1 justify-center flex-wrap">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(perguntaSeq, star)}
            onMouseEnter={() => handleStarHover(perguntaSeq, star)}
            onMouseLeave={() => handleStarLeave(perguntaSeq)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2 rounded"
          >
            <Star
              className={`h-8 w-8 ${
                star <= displayRating
                  ? "fill-warning text-warning"
                  : "fill-none text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/10 p-3">
                <Star className="h-8 w-8 text-warning" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  SUA OPINIÃO IMPORTA!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Avalie seus atendimentos e nos ajude a melhorar
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                <p className="text-muted-foreground">Carregando atendimentos...</p>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardDescription className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Nenhum atendimento para avaliar
                </p>
                <p className="text-muted-foreground">
                  Você ainda não possui atendimentos realizados para avaliar.
                </p>
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((avaliacao, index) => {
                const appointmentId = String(avaliacao.nr_atendimento);
                
                return (
                  <Card 
                    key={appointmentId} 
                    onClick={() => handleCardClick(avaliacao)}
                    className="group relative overflow-hidden border-2 hover:border-warning/50 transition-all duration-300 hover:shadow-xl animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                    
                    <CardHeader className="relative space-y-4 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                            <Star className="h-5 w-5 text-warning" />
                          </div>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-medium">
                            Pendente
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Local</p>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-warning transition-colors">
                            {avaliacao.dados.DS_LOCAL || "Atendimento"}
                          </h3>
                        </div>

                        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                          <AlertCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">Profissional</p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {avaliacao.nm_medico}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-0.5">Data do atendimento</p>
                            <p className="text-sm font-medium text-foreground">
                              {avaliacao.dados.DT_ENTRADA}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!selectedAppointment} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold">Avalie seu atendimento</DialogTitle>
            {selectedAppointment && (
              <DialogDescription className="space-y-2 mt-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-semibold text-foreground">{selectedAppointment.dados.DS_LOCAL}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Profissional</p>
                    <p className="font-semibold text-foreground">{selectedAppointment.nm_medico}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data do atendimento</p>
                    <p className="font-semibold text-foreground">{selectedAppointment.dados.DT_ENTRADA}</p>
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {loadingPerguntas ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                  <p className="text-muted-foreground">Carregando perguntas...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {perguntas.map((pergunta) => (
                  <div key={pergunta.NR_SEQUENCIA} className="space-y-3 p-4 rounded-lg bg-accent/30 border border-border">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        {pergunta.DS_PERGUNTA}
                      </label>
                      {renderStars(pergunta)}
                      {respostas[pergunta.NR_SEQUENCIA] > 0 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          {respostas[pergunta.NR_SEQUENCIA] === 1 && "Muito insatisfeito"}
                          {respostas[pergunta.NR_SEQUENCIA] === 2 && "Insatisfeito"}
                          {respostas[pergunta.NR_SEQUENCIA] === 3 && "Neutro"}
                          {respostas[pergunta.NR_SEQUENCIA] === 4 && "Satisfeito"}
                          {respostas[pergunta.NR_SEQUENCIA] === 5 && "Muito satisfeito"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Comentário adicional (opcional)
                  </label>
                  <Textarea
                    placeholder="Compartilhe sua experiência conosco..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAvaliacao}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              Enviar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default RateAppointments;
