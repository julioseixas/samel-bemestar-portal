import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiHeaders } from "@/lib/api-headers";
import DOMPurify from "dompurify";

interface Term {
  NM_TERMO: string;
  NR_SEQUENCIA: number;
  DS_TERMO: string;
}

const TermsList = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

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

    loadTerms();
  }, [patientId]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const headers = getApiHeaders();
      
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/termos/buscarTermos",
        {
          method: "GET",
          headers,
        }
      );

      const result = await response.json();

      if (result.status) {
        setTerms(result.data || []);
      } else {
        toast({
          description: result.message || "Erro ao carregar termos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar termos:", error);
      toast({
        description: "Erro ao carregar lista de termos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = (term: Term, event: React.MouseEvent) => {
    // Prevent opening modal if clicking on checkbox
    const target = event.target as HTMLElement;
    if (target.closest('button[role="checkbox"]')) {
      return;
    }
    setSelectedTerm(term);
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (termSequence: number, checked: boolean) => {
    setAcceptedTerms(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(termSequence);
      } else {
        newSet.delete(termSequence);
      }
      return newSet;
    });
  };

  const handleSubmitTerms = async () => {
    if (acceptedTerms.size === 0) {
      toast({
        description: "Por favor, aceite pelo menos um termo",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Implementar chamada de API para salvar termos aceitos
      toast({
        description: `${acceptedTerms.size} termo(s) aceito(s) com sucesso`,
      });
      
      // Remove accepted terms from the list
      setTerms(prev => prev.filter(term => !acceptedTerms.has(term.NR_SEQUENCIA)));
      setAcceptedTerms(new Set());
    } catch (error) {
      console.error("Erro ao submeter termos:", error);
      toast({
        description: "Erro ao processar termos aceitos",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/terms-to-sign")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Termos para Assinar
          </h1>
          <p className="text-muted-foreground">
            Visualize e assine os termos pendentes
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : terms.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum termo pendente</h3>
            <p className="text-muted-foreground">
              Você não possui termos para assinar no momento
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {terms.map((term) => (
                <Card 
                  key={term.NR_SEQUENCIA}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={(e) => handleTermClick(term, e)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={`term-${term.NR_SEQUENCIA}`}
                        checked={acceptedTerms.has(term.NR_SEQUENCIA)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(term.NR_SEQUENCIA, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 flex items-start justify-between gap-4">
                        <label 
                          htmlFor={`term-${term.NR_SEQUENCIA}`}
                          className="flex-1 cursor-pointer"
                        >
                          <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {term.NM_TERMO}
                          </CardTitle>
                          <CardDescription>
                            Clique no checkbox para aceitar ou clique no termo para visualizar
                          </CardDescription>
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTermClick(term, e);
                          }}
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {acceptedTerms.size > 0 && (
              <div className="mt-6 flex items-center justify-between bg-primary/10 p-4 rounded-lg border-2 border-primary">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {acceptedTerms.size} termo(s) selecionado(s)
                  </span>
                </div>
                <Button 
                  onClick={handleSubmitTerms}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar Aceitação
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-[95vw] h-[75vh] sm:h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>{selectedTerm?.NM_TERMO}</DialogTitle>
              <DialogDescription>
                Visualize o termo de consentimento
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto px-6 py-4">
              {selectedTerm?.DS_TERMO && (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(selectedTerm.DS_TERMO) 
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TermsList;
