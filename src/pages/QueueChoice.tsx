import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Stethoscope, Ambulance, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const QueueChoice = () => {
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

  const queueOptions = [
    {
      title: "Fila de Consultas",
      description: "Acompanhe sua posição na fila de consultas",
      icon: Stethoscope,
      onClick: () => navigate("/consultation-queue"),
    },
    {
      title: "Fila do Pronto Socorro",
      description: "Acompanhe sua posição na fila do pronto socorro",
      icon: Ambulance,
      onClick: () => navigate("/emergency-queue"),
    },
    {
      title: "Fila de Exames",
      description: "Acompanhe sua posição na fila de exames",
      icon: TestTube,
      onClick: () => navigate("/exam-queue"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Fila de Atendimento
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <p className="text-muted-foreground mb-6">
            Selecione qual fila você deseja acompanhar:
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {queueOptions.map((option, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={option.onClick}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <option.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QueueChoice;
