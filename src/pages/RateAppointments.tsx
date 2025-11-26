import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";
import { parse, isBefore, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  [key: string]: any;
}

interface Rating {
  appointmentId: string;
  stars: number;
  comment: string;
}

const RateAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AvaliacaoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<{ [key: string]: Rating }>({});
  const [hoveredStars, setHoveredStars] = useState<{ [key: string]: number }>({});

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

      if (allPendingEvaluations.length > 0) {
        console.log("Estrutura de avaliação pendente:", allPendingEvaluations[0]);
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

  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date());
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleStarClick = (appointmentId: string, stars: number) => {
    setRatings(prev => ({
      ...prev,
      [appointmentId]: {
        appointmentId,
        stars,
        comment: prev[appointmentId]?.comment || "",
      }
    }));
  };

  const handleStarHover = (appointmentId: string, stars: number) => {
    setHoveredStars(prev => ({
      ...prev,
      [appointmentId]: stars,
    }));
  };

  const handleStarLeave = (appointmentId: string) => {
    setHoveredStars(prev => ({
      ...prev,
      [appointmentId]: 0,
    }));
  };

  const handleCommentChange = (appointmentId: string, comment: string) => {
    setRatings(prev => ({
      ...prev,
      [appointmentId]: {
        appointmentId,
        stars: prev[appointmentId]?.stars || 0,
        comment,
      }
    }));
  };

  const handleSubmitRating = (appointmentId: string) => {
    const rating = ratings[appointmentId];
    
    if (!rating || rating.stars === 0) {
      toast({
        variant: "destructive",
        title: "Avaliação incompleta",
        description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.",
      });
      return;
    }

    // Aqui será implementada a chamada à API de avaliação quando disponível
    toast({
      title: "Avaliação enviada!",
      description: "Obrigado pelo seu feedback. Ele é muito importante para nós!",
    });

    // Limpa a avaliação enviada
    setRatings(prev => {
      const newRatings = { ...prev };
      delete newRatings[appointmentId];
      return newRatings;
    });
  };

  const renderStars = (appointmentId: string) => {
    const currentRating = ratings[appointmentId]?.stars || 0;
    const hoverRating = hoveredStars[appointmentId] || 0;
    const displayRating = hoverRating || currentRating;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(appointmentId, star)}
            onMouseEnter={() => handleStarHover(appointmentId, star)}
            onMouseLeave={() => handleStarLeave(appointmentId)}
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
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Nenhum atendimento para avaliar
                </p>
                <p className="text-muted-foreground">
                  Você ainda não possui atendimentos realizados para avaliar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((avaliacao, index) => {
                const appointmentId = avaliacao.id || avaliacao.idAgendamento || `${index}`;
                
                return (
                  <Card key={appointmentId} className="overflow-hidden">
                    <CardHeader className="bg-accent/50">
                      <CardTitle className="text-lg sm:text-xl">
                        {avaliacao.descricaoEspecialidade || avaliacao.especialidade || "Atendimento"}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <span className="font-medium">
                            Profissional: {avaliacao.nomeProfissional || avaliacao.medico || "Não informado"}
                          </span>
                          <span>
                            Data: {avaliacao.dataAtendimento || avaliacao.dataAgenda || avaliacao.data || "Não informada"}
                          </span>
                        </div>
                        <div>Paciente: {avaliacao.nomeCliente || avaliacao.paciente || patientName}</div>
                      </CardDescription>
                    </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">
                          Como você avalia este atendimento?
                        </label>
                        {renderStars(appointmentId)}
                        {ratings[appointmentId]?.stars > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {ratings[appointmentId].stars === 1 && "Muito insatisfeito"}
                            {ratings[appointmentId].stars === 2 && "Insatisfeito"}
                            {ratings[appointmentId].stars === 3 && "Neutro"}
                            {ratings[appointmentId].stars === 4 && "Satisfeito"}
                            {ratings[appointmentId].stars === 5 && "Muito satisfeito"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Comentário (opcional)
                        </label>
                        <Textarea
                          placeholder="Compartilhe sua experiência conosco..."
                          value={ratings[appointmentId]?.comment || ""}
                          onChange={(e) => handleCommentChange(appointmentId, e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={() => handleSubmitRating(appointmentId)}
                        variant="default"
                        className="w-full sm:w-auto bg-warning hover:bg-warning/90 text-warning-foreground"
                      >
                        Enviar Avaliação
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RateAppointments;
