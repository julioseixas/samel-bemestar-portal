import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, ChevronLeft, ChevronRight, Send, MessageSquare } from "lucide-react";
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

// ── Rating Card for Q1 (1-10 NPS) ──
const NpsRatingCard = ({
  avaliacao,
  onRate,
  onComment,
  onSubmit,
}: {
  avaliacao: AvaliacaoComResposta;
  onRate: (rating: number) => void;
  onComment: (comment: string) => void;
  onSubmit: () => void;
}) => {
  const [showComment, setShowComment] = useState(false);

  const getColor = (n: number, selected: boolean) => {
    if (!selected) return "border-border text-muted-foreground bg-card";
    if (n <= 6) return "border-destructive bg-destructive text-destructive-foreground shadow-md";
    if (n <= 8) return "border-warning bg-warning text-warning-foreground shadow-md";
    return "border-success bg-success text-success-foreground shadow-md";
  };

  const getLabelColor = (rating: number) => {
    if (rating <= 6) return "text-destructive";
    if (rating <= 8) return "text-warning";
    return "text-success";
  };

  const getLabel = (rating: number) => {
    if (rating === 0) return "";
    if (rating <= 3) return "Muito insatisfeito";
    if (rating <= 5) return "Insatisfeito";
    if (rating <= 6) return "Neutro";
    if (rating <= 8) return "Satisfeito";
    return "Muito satisfeito";
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Big number display */}
      {avaliacao.rating > 0 && (
        <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
          <span className={`text-5xl font-black ${getLabelColor(avaliacao.rating)}`}>
            {avaliacao.rating}
          </span>
          <span className={`text-sm font-medium ${getLabelColor(avaliacao.rating)}`}>
            {getLabel(avaliacao.rating)}
          </span>
        </div>
      )}

      {/* NPS scale labels */}
      <div className="w-full flex justify-between px-1">
        <span className="text-xs text-muted-foreground">Nada provável</span>
        <span className="text-xs text-muted-foreground">Muito provável</span>
      </div>

      {/* Number buttons */}
      <div className="flex justify-between w-full gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onRate(num)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-sm border-2 transition-all duration-200 touch-manipulation select-none flex items-center justify-center ${getColor(num, avaliacao.rating === num)}`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Comment toggle */}
      {!showComment ? (
        <button
          type="button"
          onClick={() => setShowComment(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Adicionar comentário
        </button>
      ) : (
        <div className="w-full space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <Textarea
            placeholder="Conte-nos mais sobre sua experiência..."
            value={avaliacao.comentario}
            onChange={(e) => onComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      )}

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={avaliacao.rating === 0}
      >
        <Send className="w-4 h-4 mr-2" />
        Enviar Avaliação
      </Button>
    </div>
  );
};

// ── Star Rating Card (1-5 stars) ──
const StarRatingCard = ({
  avaliacao,
  maxRating,
  onRate,
  onComment,
  onSubmit,
}: {
  avaliacao: AvaliacaoComResposta;
  maxRating: number;
  onRate: (rating: number) => void;
  onComment: (comment: string) => void;
  onSubmit: () => void;
}) => {
  const [showComment, setShowComment] = useState(false);
  const ignoreMouseUntil = useRef(0);

  const getLabel = (rating: number) => {
    if (rating === 0) return "Toque para avaliar";
    const labels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
    return labels[rating - 1] || "";
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Star label */}
      <span className={`text-sm font-medium transition-colors ${avaliacao.rating > 0 ? "text-foreground" : "text-muted-foreground"}`}>
        {getLabel(avaliacao.rating)}
      </span>

      {/* Stars */}
      <div className="flex gap-3">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              ignoreMouseUntil.current = Date.now() + 1200;
              onRate(star);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              if (Date.now() < ignoreMouseUntil.current) return;
              onRate(star);
            }}
            onClick={(e) => e.preventDefault()}
            className="transition-transform active:scale-90 touch-manipulation select-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <Star
              className={`pointer-events-none w-10 h-10 transition-colors duration-150 ${
                star <= avaliacao.rating
                  ? "fill-warning text-warning"
                  : "text-border"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment toggle */}
      {!showComment ? (
        <button
          type="button"
          onClick={() => setShowComment(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Adicionar comentário
        </button>
      ) : (
        <div className="w-full space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <Textarea
            placeholder="Conte-nos mais sobre sua experiência..."
            value={avaliacao.comentario}
            onChange={(e) => onComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      )}

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={avaliacao.rating === 0}
      >
        <Send className="w-4 h-4 mr-2" />
        Enviar Avaliação
      </Button>
    </div>
  );
};

// ── Main Page ──
const EvaluateProfessional = () => {
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComResposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openDrawerIndex, setOpenDrawerIndex] = useState<number | null>(null);

  const getMaxRating = (idPergunta: string) => (idPergunta === "Q1" ? 10 : 5);

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
    } catch {
      toast.error("Erro ao buscar avaliações disponíveis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = useCallback(
    (index: number, rating: number) => {
      setAvaliacoes((prev) =>
        prev.map((av, i) => (i === index ? { ...av, rating } : av))
      );
    },
    []
  );

  const handleComentarioChange = (index: number, comentario: string) => {
    setAvaliacoes((prev) =>
      prev.map((av, i) => (i === index ? { ...av, comentario } : av))
    );
  };

  const handleSubmitAvaliacao = async (avaliacao: AvaliacaoComResposta) => {
    if (avaliacao.rating === 0) {
      toast.error(`Por favor, selecione uma nota de 1 a ${getMaxRating(avaliacao.idPergunta)}`);
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
            idAtendimento,
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
        // Move to next if available
        if (currentIndex < avaliacoes.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
        fetchAvaliacoes(idAtendimento);
      } else {
        toast.error(data.mensagem || "Erro ao enviar avaliação");
      }
    } catch {
      toast.error("Erro ao enviar avaliação");
    }
  };

  const current = avaliacoes[currentIndex];
  const isQ1 = current?.idPergunta === "Q1";
  const total = avaliacoes.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header patientName={patientName} profilePhoto={profilePhoto} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando avaliações...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto} />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/hospitalization-options")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Avaliação</h1>
            <p className="text-xs text-muted-foreground">
              Nos ajude a melhorar nosso atendimento
            </p>
          </div>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Não há avaliações disponíveis no momento
            </p>
          </div>
        ) : (
          <>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {avaliacoes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <p className="text-center text-xs text-muted-foreground mb-4">
              {currentIndex + 1} de {total}
            </p>

            {/* Current evaluation card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {/* Sector badge */}
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {current.dsSetor}
                </span>
              </div>

              {/* Question */}
              <p className="text-center text-base font-semibold text-foreground mb-6 leading-relaxed">
                {current.dsPergunta}
              </p>

              {/* Rating UI */}
              {isQ1 ? (
                <>
                  {/* On mobile: open drawer. On desktop: inline */}
                  <div className="hidden sm:block">
                    <NpsRatingCard
                      avaliacao={current}
                      onRate={(r) => handleRatingChange(currentIndex, r)}
                      onComment={(c) => handleComentarioChange(currentIndex, c)}
                      onSubmit={() => handleSubmitAvaliacao(current)}
                    />
                  </div>
                  <div className="sm:hidden flex flex-col items-center gap-3">
                    {current.rating > 0 && (
                      <span
                        className={`text-3xl font-black ${
                          current.rating <= 6
                            ? "text-destructive"
                            : current.rating <= 8
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {current.rating}/10
                      </span>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setOpenDrawerIndex(currentIndex)}
                    >
                      {current.rating > 0 ? "Alterar Nota" : "Toque para avaliar"}
                    </Button>
                  </div>

                  <Drawer
                    open={openDrawerIndex === currentIndex}
                    onOpenChange={(open) =>
                      setOpenDrawerIndex(open ? currentIndex : null)
                    }
                  >
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle className="text-base leading-snug">
                          {current.dsPergunta}
                        </DrawerTitle>
                      </DrawerHeader>
                      <div className="px-4 pb-4">
                        <NpsRatingCard
                          avaliacao={current}
                          onRate={(r) => handleRatingChange(currentIndex, r)}
                          onComment={(c) =>
                            handleComentarioChange(currentIndex, c)
                          }
                          onSubmit={() => {
                            handleSubmitAvaliacao(current);
                            setOpenDrawerIndex(null);
                          }}
                        />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </>
              ) : (
                <StarRatingCard
                  avaliacao={current}
                  maxRating={getMaxRating(current.idPergunta)}
                  onRate={(r) => handleRatingChange(currentIndex, r)}
                  onComment={(c) => handleComentarioChange(currentIndex, c)}
                  onSubmit={() => handleSubmitAvaliacao(current)}
                />
              )}
            </div>

            {/* Navigation arrows */}
            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentIndex((p) => Math.min(total - 1, p + 1))
                }
                disabled={currentIndex === total - 1}
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EvaluateProfessional;
