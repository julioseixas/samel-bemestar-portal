import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Receipt, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function CoparticipationChoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const patientData = JSON.parse(localStorage.getItem("patientData") || "[]");
  const patientName = patientData[0]?.nome || "Usuário";
  const profilePhoto = patientData[0]?.clienteContratos?.[0]?.fotoPerfil;

  const handlePriceTable = () => {
    toast({
      title: "Tabela de Preços",
      description: "Esta funcionalidade está em desenvolvimento.",
    });
  };

  const handleStatement = () => {
    toast({
      title: "Extrato",
      description: "Esta funcionalidade está em desenvolvimento.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Coparticipação
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione o que deseja visualizar
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
            size="sm"
          >
            ← Voltar ao Dashboard
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mt-8">
          <div 
            className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={handlePriceTable}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-xl bg-muted p-4">
                <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  TABELA DE PREÇOS
                </h2>
                <p className="text-sm text-muted-foreground">
                  Consulte os valores de coparticipação por procedimento
                </p>
              </div>
              <Button 
                className="w-full bg-success hover:bg-success/90 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePriceTable();
                }}
              >
                Ver Tabela
              </Button>
            </div>
          </div>

          <div 
            className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={handleStatement}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-xl bg-muted p-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-success" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  EXTRATO DE COPARTICIPAÇÃO
                </h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o histórico dos seus valores pagos
                </p>
              </div>
              <Button 
                className="w-full bg-success hover:bg-success/90 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatement();
                }}
              >
                Ver Extrato
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
