import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Stethoscope, Activity, UtensilsCrossed, Sparkles, ArrowLeft, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { getApiHeaders } from "@/lib/api-headers";

interface Avaliacao {
  idCliente: string;
  idAtendimento: number;
  idTipoEvolucao: string;
  idEvolucao: number;
  dataEntrada: string;
  dsEspecialidade: string;
  dsEvolucao: string;
  dsPergunta: string;
  dsSetor: string;
  idPergunta: string;
  idUnidade: string;
  medico: string;
  nome: string;
  nomeUsuarioAtendimento: string;
}

interface AvaliacaoComResposta extends Avaliacao {
  rating: number;
  comentario: string;
}

const EvaluateProfessional = () => {
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComResposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    if (patientData) {
      const parsed = JSON.parse(patientData);
      setPatientName(parsed[0]?.nome || "Paciente");
      setProfilePhoto(parsed[0]?.clienteContratos?.[0]?.fotoUsuario || "");
    }

    const hospitalizationData = localStorage.getItem("hospitalizationData");
    if (!hospitalizationData) {
      navigate("/dashboard");
      return;
    }

    const { idAtendimento } = JSON.parse(hospitalizationData);
    if (!idAtendimento) {
      toast.error("ID de atendimento não encontrado");
      navigate("/hospitalization-options");
      return;
    }

    fetchAvaliacoes(idAtendimento);
  }, [navigate]);

  const fetchAvaliacoes = async (idAtendimento: number) => {
    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Internacao/ObterPerguntasDisponiveis",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ idAtendimento }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        const avaliacoesComResposta: AvaliacaoComResposta[] = data.dados.map(
          (av: Avaliacao) => ({
            ...av,
            rating: 0,
            comentario: "",
          })
        );
        setAvaliacoes(avaliacoesComResposta);
      } else {
        toast.error(data.mensagem || "Erro ao buscar avaliações");
      }
    } catch (error) {
      toast.error("Erro ao buscar avaliações disponíveis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (index: number, rating: number) => {
    setAvaliacoes((prev) =>
      prev.map((av, i) => (i === index ? { ...av, rating } : av))
    );
  };

  const handleComentarioChange = (index: number, comentario: string) => {
    setAvaliacoes((prev) =>
      prev.map((av, i) => (i === index ? { ...av, comentario } : av))
    );
  };

  const getIconByIdPergunta = (idPergunta: string) => {
    switch (idPergunta) {
      case "A1":
        return <Stethoscope className="w-10 h-10 text-primary" />;
      case "B1":
        return <Activity className="w-10 h-10 text-primary" />;
      case "N1":
        return <UtensilsCrossed className="w-10 h-10 text-primary" />;
      case "H1":
        return <Sparkles className="w-10 h-10 text-primary" />;
      case "C1":
        return <UserCheck className="w-10 h-10 text-primary" />;
      default:
        return <Star className="w-10 h-10 text-primary" />;
    }
  };

  const handleSubmitAvaliacao = async (avaliacao: AvaliacaoComResposta) => {
    if (avaliacao.rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas");
      return;
    }

    const hospitalizationData = localStorage.getItem("hospitalizationData");
    if (!hospitalizationData) {
      toast.error("Dados de internação não encontrados");
      return;
    }

    const { idAtendimento } = JSON.parse(hospitalizationData);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Internacao/CadastrarResposta",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idAtendimento: idAtendimento,
            idPergunta: avaliacao.idPergunta,
            dsDescricao: avaliacao.rating.toString(),
            idEvolucao: avaliacao.idEvolucao.toString(),
            dsObservacao: avaliacao.comentario || "",
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        toast.success(data.mensagem);
        fetchAvaliacoes(idAtendimento);
      } else {
        toast.error(data.mensagem || "Erro ao enviar avaliação");
      }
    } catch (error) {
      toast.error("Erro ao enviar avaliação");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          patientName={patientName}
          profilePhoto={profilePhoto}
        />
        <main className="flex-1 container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">
            Carregando avaliações...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        patientName={patientName}
        profilePhoto={profilePhoto}
      />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">
              Avaliar Profissional
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/hospitalization-options")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <p className="text-muted-foreground">
            Avalie o atendimento recebido durante sua internação
          </p>
        </div>

        {avaliacoes.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Não há avaliações disponíveis no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avaliacoes.map((avaliacao, index) => (
              <Card key={`${avaliacao.idPergunta}-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {avaliacao.dsPergunta}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Setor: {avaliacao.dsSetor}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getIconByIdPergunta(avaliacao.idPergunta)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(index, star)}
                        className="transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= avaliacao.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Comentário (opcional)
                    </label>
                    <Textarea
                      placeholder="Deixe seu comentário sobre o atendimento..."
                      value={avaliacao.comentario}
                      onChange={(e) =>
                        handleComentarioChange(index, e.target.value)
                      }
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleSubmitAvaliacao(avaliacao)}
                  >
                    Enviar Avaliação
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EvaluateProfessional;
