import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Calendar, MapPin, User, ArrowLeft, Stethoscope, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurgicalData {
  status: string;
  dataAtualizacao: string;
  data: string;
  hora: string;
  procedimento: {
    nome: string;
  };
  profissional: {
    nome: string;
    crm: string;
  };
  txtDescParagrafo1: string;
  txtDescParagrafo2: string;
  unidade: string;
}

export default function SurgicalTracking() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [surgicalData, setSurgicalData] = useState<SurgicalData | null>(null);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");
    const storedSurgicalSchedule = localStorage.getItem("surgicalSchedule");

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

    if (storedSurgicalSchedule) {
      try {
        const parsed = JSON.parse(storedSurgicalSchedule);
        // Se for um array, pega o primeiro item
        const data = Array.isArray(parsed) ? parsed[0] : parsed;
        setSurgicalData(data);
      } catch (error) {
        console.error("Erro ao processar dados cirúrgicos:", error);
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Data não informada";
    try {
      const [day, month, year] = dateStr.split('/');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getProgressStep = () => {
    if (surgicalData?.status === "Autorizado") return 2;
    return 1; // "Pré-Agenda" ou qualquer outro status
  };

  const currentStep = getProgressStep();

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground md:text-3xl">
                Acompanhamento Cirúrgico
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
              Detalhes da sua cirurgia agendada
            </p>
          </div>

          {surgicalData ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Progress Bar */}
              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    {/* Passo 1 - Aguardando Agendamento */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                        currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep >= 1 ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-semibold">1</span>}
                      </div>
                      <span className="text-xs sm:text-sm mt-2 text-center font-medium">
                        Aguardando<br />Agendamento
                      </span>
                    </div>
                    
                    {/* Linha conectora */}
                    <div className={`h-1 flex-1 mx-2 sm:mx-4 transition-colors ${
                      currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                    }`} />
                    
                    {/* Passo 2 - Agendado */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                        currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep >= 2 ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-semibold">2</span>}
                      </div>
                      <span className="text-xs sm:text-sm mt-2 text-center font-medium">
                        Agendado
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Badge */}
              {surgicalData.status && (
                <div className="flex justify-center">
                  <Badge variant="default" className="text-base px-4 py-2">
                    {surgicalData.status}
                  </Badge>
                </div>
              )}

              {/* Card Principal */}
              <Card className="border-2">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Informações da Cirurgia</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Procedimento */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Stethoscope className="h-4 w-4" />
                      Procedimento
                    </div>
                    <p className="text-lg font-semibold text-foreground pl-6">
                      {surgicalData.procedimento?.nome || "Não informado"}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4" />

                  {/* Data da Cirurgia */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Calendar className="h-4 w-4" />
                      Data da Cirurgia
                    </div>
                    <p className="text-lg font-semibold text-foreground pl-6">
                      {formatDate(surgicalData.data)}
                      {surgicalData.hora && (
                        <span className="text-muted-foreground ml-2">às {surgicalData.hora}</span>
                      )}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4" />

                  {/* Local */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <MapPin className="h-4 w-4" />
                      Local
                    </div>
                    <p className="text-lg font-semibold text-foreground pl-6">
                      {surgicalData.unidade || "Não informado"}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4" />

                  {/* Profissional */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <User className="h-4 w-4" />
                      Profissional
                    </div>
                    <p className="text-lg font-semibold text-foreground pl-6">
                      {surgicalData.profissional?.nome || "Não informado"}
                      {surgicalData.profissional?.crm && (
                        <span className="text-muted-foreground text-base ml-2">
                          - CRM: {surgicalData.profissional.crm}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Adicionais */}
              {(surgicalData.txtDescParagrafo1 || surgicalData.txtDescParagrafo2) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {surgicalData.txtDescParagrafo1 && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {surgicalData.txtDescParagrafo1}
                      </p>
                    )}
                    {surgicalData.txtDescParagrafo2 && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {surgicalData.txtDescParagrafo2}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Data de Atualização */}
              {surgicalData.dataAtualizacao && (
                <div className="text-center text-xs text-muted-foreground">
                  Última atualização: {surgicalData.dataAtualizacao}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Nenhum dado de cirurgia disponível.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
