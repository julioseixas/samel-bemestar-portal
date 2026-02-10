import { Header } from "@/components/Header";
import { DashboardCard } from "@/components/DashboardCard";
import { Receipt, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const CoparticipationChoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handlePriceTable = () => {
    navigate("/coparticipation-price-table");
  };

  const handleHistory = () => {
    navigate("/coparticipation-history");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-row items-center justify-between mb-2 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl truncate min-w-0">
                Coparticipação
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm shrink-0"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Selecione o que deseja visualizar
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl">
            <DashboardCard
              title="TABELA DE PREÇOS"
              description="Consulte os valores de coparticipação por procedimento"
              icon={Receipt}
              iconColor="text-primary"
              buttonText="Ver Tabela"
              variant="default"
              useDashboardColor={true}
              onClick={handlePriceTable}
            />
            
            <DashboardCard
              title="HISTÓRICO DE COPARTICIPAÇÃO"
              description="Acompanhe o histórico dos seus procedimentos"
              icon={FileText}
              iconColor="text-primary"
              buttonText="Ver Histórico"
              variant="default"
              useDashboardColor={true}
              onClick={handleHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoparticipationChoice;
