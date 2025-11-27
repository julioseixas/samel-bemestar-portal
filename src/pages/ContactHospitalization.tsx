import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";

export default function ContactHospitalization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [reclamacao, setReclamacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [idAtendimento, setIdAtendimento] = useState<number | null>(null);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");
    const hospitalizationData = localStorage.getItem("hospitalizationData");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
        setPatientName(storedTitular);
      }
    }

    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }

    if (hospitalizationData) {
      try {
        const parsed = JSON.parse(hospitalizationData);
        setIdAtendimento(parsed.idAtendimento);
      } catch (error) {
        console.error("Erro ao processar dados de internação:", error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reclamacao.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, descreva sua reclamação",
        variant: "destructive",
      });
      return;
    }

    if (!idAtendimento) {
      toast({
        title: "Erro",
        description: "Dados de atendimento não encontrados",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Internacao/CadastrarReclamacao",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idAtendimento: idAtendimento,
            dsReclamacao: reclamacao,
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        toast({
          title: "Sucesso",
          description: data.mensagem,
        });
        navigate("/hospitalization-options");
      } else {
        toast({
          title: "Erro",
          description: data.mensagem || "Erro ao enviar reclamação",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar reclamação:", error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground md:text-3xl">
                Fale Conosco
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/hospitalization-options")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Entre em contato sobre sua internação
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Registrar Reclamação
                </CardTitle>
                <CardDescription>
                  Descreva sua reclamação sobre o atendimento na internação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reclamacao">Reclamação</Label>
                    <Textarea
                      id="reclamacao"
                      placeholder="Descreva sua reclamação sobre o atendimento"
                      value={reclamacao}
                      onChange={(e) => setReclamacao(e.target.value)}
                      rows={8}
                      disabled={loading}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Reclamação"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
