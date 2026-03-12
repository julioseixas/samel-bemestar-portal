import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Stethoscope, Activity, UtensilsCrossed, Sparkles, ArrowLeft, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { getApiHeaders } from "@/lib/api-headers";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

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
  const [openDrawerIndex, setOpenDrawerIndex] = useState<number | null>(null);
  const ratingLockUntil = useRef<Record<number, number>>({});
  const ignoreMouseUntilRef = useRef<Record<number, number>>({});

  const getMaxRating = (idPergunta: string) => idPergunta === "Q1" ? 10 : 5;

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

        const debugQ1: AvaliacaoComResposta = {
          idCliente: "DEBUG",
          idAtendimento: idAtendimento,
          idTipoEvolucao: "DEBUG",
          idEvolucao: 0,
          dataEntrada: new Date().toISOString(),
          dsEspecialidade: "DEBUG - Frontend",
          dsEvolucao: "DEBUG",
          dsPergunta: "[DEBUG FRONTEND] Avaliação Q1 - Gerada localmente para teste",
          dsSetor: "Debug",
          idPergunta: "Q1",
          idUnidade: "0",
          medico: "Debug",
          nome: "Debug",
          nomeUsuarioAtendimento: "Debug",
          rating: 0,
          comentario: "",
        };

        setAvaliacoes([debugQ1, ...avaliacoesComResposta]);
      } else {
        toast.error(data.mensagem || "Erro ao buscar avaliações");
      }
    } catch (error) {
      toast.error("Erro ao buscar avaliações disponíveis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = useCallback((index: number, rating: number, idPergunta: string) => {
    const isQ1 = idPergunta === "Q1";
    
    if (isQ1) {
      const now = Date.now();
      const lockUntil = ratingLockUntil.current[index] || 0;
      if (now < lockUntil) {
        return; // ignore ghost event within lock window
      }
      ratingLockUntil.current[index] = now + 600;
    }
    
    setAvaliacoes((prev) =>
      prev.map((av, i) => (i === index ? { ...av, rating } : av))
    );
  }, []);

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
    const maxRating = getMaxRating(avaliacao.idPergunta);
    if (avaliacao.rating === 0) {
      toast.error(`Por favor, selecione uma nota de 1 a ${maxRating}`);
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
            idEvolucao: avaliacao.idEvolucao,
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
                  {avaliacao.idPergunta === "Q1" ? (
                    <>
                      <div className="flex items-center gap-3">
                        {avaliacao.rating > 0 && (
                          <span className={`text-2xl font-bold ${
                            avaliacao.rating <= 6 ? "text-destructive" : avaliacao.rating <= 8 ? "text-warning" : "text-success"
                          }`}>
                            {avaliacao.rating}/10
                          </span>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setOpenDrawerIndex(index)}
                        >
                          {avaliacao.rating > 0 ? "Alterar Nota" : "Avaliar"}
                        </Button>
                      </div>

                      <Drawer open={openDrawerIndex === index} onOpenChange={(open) => setOpenDrawerIndex(open ? index : null)}>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle className="text-base leading-snug">
                              {avaliacao.dsPergunta}
                            </DrawerTitle>
                          </DrawerHeader>

                          <div className="px-4 pb-2">
                            <p className="text-sm text-muted-foreground mb-3">Selecione uma nota de 1 a 10:</p>
                            <div className="flex justify-between gap-1.5">
                              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                                const isSelected = avaliacao.rating === num;
                                const colorClass = num <= 6
                                  ? "bg-destructive text-destructive-foreground"
                                  : num <= 8
                                    ? "bg-warning text-warning-foreground"
                                    : "bg-success text-success-foreground";
                                const unselectedClass = num <= 6
                                  ? "border-destructive/40 text-destructive"
                                  : num <= 8
                                    ? "border-warning/40 text-warning"
                                    : "border-success/40 text-success";

                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleRatingChange(index, num, avaliacao.idPergunta)}
                                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full font-bold text-sm sm:text-base transition-all touch-manipulation select-none flex items-center justify-center border-2 ${
                                      isSelected
                                        ? `${colorClass} scale-110 shadow-md border-transparent`
                                        : `bg-transparent ${unselectedClass}`
                                    }`}
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="px-4 py-2 space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              Comentário (opcional)
                            </label>
                            <Textarea
                              placeholder="Deixe seu comentário sobre o atendimento..."
                              value={avaliacao.comentario}
                              onChange={(e) => handleComentarioChange(index, e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>

                          <DrawerFooter>
                            <Button
                              className="w-full"
                              onClick={() => {
                                handleSubmitAvaliacao(avaliacao);
                                setOpenDrawerIndex(null);
                              }}
                              disabled={avaliacao.rating === 0}
                            >
                              Enviar Avaliação
                            </Button>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: getMaxRating(avaliacao.idPergunta) }, (_, i) => i + 1).map((star) => (
                          <button
                            key={star}
                            type="button"
                            onTouchStart={(e) => {
                              e.preventDefault();
                              ignoreMouseUntilRef.current[index] = Date.now() + 1200;
                              handleRatingChange(index, star, avaliacao.idPergunta);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (Date.now() < (ignoreMouseUntilRef.current[index] || 0)) return;
                              handleRatingChange(index, star, avaliacao.idPergunta);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              if (Date.now() < (ignoreMouseUntilRef.current[index] || 0)) return;
                            }}
                            className="transition-colors touch-manipulation select-none flex-shrink-0"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <Star
                              className={`pointer-events-none w-8 h-8 ${
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
                          onChange={(e) => handleComentarioChange(index, e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleSubmitAvaliacao(avaliacao)}
                      >
                        Enviar Avaliação
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EvaluateProfessional;
