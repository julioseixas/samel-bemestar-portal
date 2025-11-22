import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Coparticipação
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
          >
            ← Voltar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={handlePriceTable}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-fit">
                <Receipt className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-xl">Tabela de Preços</CardTitle>
              <CardDescription>
                Consulte os valores de coparticipação por procedimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePriceTable();
                }}
              >
                Ver Tabela
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={handleStatement}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 rounded-full bg-success/10 p-4 w-fit">
                <FileText className="h-12 w-12 text-success" />
              </div>
              <CardTitle className="text-xl">Extrato de Coparticipação</CardTitle>
              <CardDescription>
                Acompanhe o histórico dos seus valores pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatement();
                }}
              >
                Ver Extrato
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
