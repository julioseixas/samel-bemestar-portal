import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ConsultationQueue = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

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
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0 flex-1">
              Fila de Consultas
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/queue-choice")}
              className="flex items-center gap-2 flex-shrink-0 shrink-0 ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Stethoscope className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  Nenhuma consulta na fila
                </h3>
                <p className="text-sm text-muted-foreground">
                  Você não possui consultas na fila no momento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConsultationQueue;
