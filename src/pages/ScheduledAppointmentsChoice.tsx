import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ScheduledAppointmentsChoice = () => {
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
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Consultas e Exames Agendados
            </h1>
            <p className="text-muted-foreground">
              Escolha o que deseja visualizar
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
            size="sm"
          >
            ← Voltar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          <Card 
            className="p-8 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate("/scheduled-appointments")}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Consultas Agendadas</h2>
              <p className="text-muted-foreground text-sm">
                Visualize todas as suas consultas médicas agendadas
              </p>
              <Button className="w-full mt-2">
                Ver Consultas
              </Button>
            </div>
          </Card>

          <Card 
            className="p-8 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate("/scheduled-exams")}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
                <TestTube className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Exames Agendados</h2>
              <p className="text-muted-foreground text-sm">
                Visualize todos os seus exames laboratoriais agendados
              </p>
              <Button className="w-full mt-2">
                Ver Exames
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ScheduledAppointmentsChoice;
