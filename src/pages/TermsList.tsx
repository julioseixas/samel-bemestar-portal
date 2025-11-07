import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiHeaders } from "@/lib/api-headers";

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
  const [pdfUrl, setPdfUrl] = useState<string>("");

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

  const handleTermClick = (term: Term) => {
    setSelectedTerm(term);
    
    // Converter base64 para Blob URL
    try {
      const base64Data = term.DS_TERMO.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      toast({
        description: "Erro ao carregar o PDF",
        variant: "destructive",
      });
    }
    
    setIsModalOpen(true);
  };

  // Limpar URL quando fechar o modal
  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
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
          <div className="space-y-4">
            {terms.map((term) => (
              <Card 
                key={term.NR_SEQUENCIA}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTermClick(term)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {term.NM_TERMO}
                      </CardTitle>
                    </div>
                    <Button variant="outline" size="sm">
                      Visualizar
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>{selectedTerm?.NM_TERMO}</DialogTitle>
              <DialogDescription>
                Visualize o termo de consentimento
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-muted">
              {pdfUrl && (
                <embed
                  src={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
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
