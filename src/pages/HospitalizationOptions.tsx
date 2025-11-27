import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Stethoscope, FileText, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HospitalizationOptions() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [hasIdAtendimento, setHasIdAtendimento] = useState(false);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");

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

    // Verifica se tem dados da agenda cirúrgica
    const surgicalSchedule = localStorage.getItem("surgicalSchedule");
    if (!surgicalSchedule) {
      navigate("/dashboard");
    }

    // Verifica se tem idAtendimento para habilitar prescrições
    const hospitalizationData = localStorage.getItem("hospitalizationData");
    if (hospitalizationData) {
      try {
        const parsedData = JSON.parse(hospitalizationData);
        if (parsedData.idAtendimento) {
          setHasIdAtendimento(true);
        }
      } catch (error) {
        console.error("Erro ao processar hospitalizationData:", error);
      }
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground md:text-3xl">
                Acompanhamento da Internação
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Escolha uma opção para continuar
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {/* Acompanhamento Cirúrgico */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
              onClick={() => navigate("/surgical-tracking")}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Acompanhamento Cirúrgico</CardTitle>
                    <CardDescription className="mt-1">
                      Veja os detalhes da sua cirurgia agendada
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Verificar Prescrição */}
            <Card 
              className={
                hasIdAtendimento
                  ? "group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
                  : "opacity-50 cursor-not-allowed border-2"
              }
              onClick={hasIdAtendimento ? () => navigate("/prescriptions-tracking") : undefined}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${hasIdAtendimento ? 'bg-primary/10 group-hover:bg-primary/20 transition-colors' : 'bg-muted'}`}>
                    <FileText className={`h-6 w-6 ${hasIdAtendimento ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${hasIdAtendimento ? '' : 'text-muted-foreground'}`}>
                      Verificar Prescrição
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {hasIdAtendimento ? "Veja as prescrições da sua internação" : "Em breve disponível"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
