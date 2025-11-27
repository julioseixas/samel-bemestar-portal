import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Calendar, MapPin, User, ArrowLeft, Stethoscope, Check, FileText } from "lucide-react";
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
            <div className="space-y-6">
              {/* Card Principal com Progress Bar Integrado */}
              <Card className="border-2 shadow-lg">
                {/* Header com Status */}
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-8">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/20 p-3">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl">Acompanhamento Cirúrgico</CardTitle>
                    </div>
                    {surgicalData.status && (
                      <Badge variant="default" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
                        {surgicalData.status}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-10 px-4 sm:px-8">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                      {/* Passo 1 - Aguardando Agendamento */}
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                          currentStep >= 1 ? 'bg-primary text-primary-foreground scale-105' : 'bg-muted text-muted-foreground'
                        }`}>
                          {currentStep >= 1 ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-semibold">1</span>}
                        </div>
                        <span className={`text-xs sm:text-sm mt-2 text-center font-medium transition-colors ${
                          currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          Aguardando<br />Agendamento
                        </span>
                      </div>
                      
                      {/* Linha conectora */}
                      <div className={`h-1 flex-1 mx-2 sm:mx-4 rounded-full transition-all duration-500 ${
                        currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                      }`} />
                      
                      {/* Passo 2 - Agendado */}
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                          currentStep >= 2 ? 'bg-primary text-primary-foreground scale-105' : 'bg-muted text-muted-foreground'
                        }`}>
                          {currentStep >= 2 ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-semibold">2</span>}
                        </div>
                        <span className={`text-xs sm:text-sm mt-2 text-center font-medium transition-colors ${
                          currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          Agendado
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Informações da Cirurgia */}
                <CardContent className="pt-8 pb-6">
                  <div className="grid gap-6 sm:gap-8">
                    {/* Procedimento */}
                    <div className="group">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Procedimento
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-foreground pl-11">
                        {surgicalData.procedimento?.nome || "Não informado"}
                      </p>
                    </div>

                    {/* Data da Cirurgia */}
                    <div className="group">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Data da Cirurgia
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-foreground pl-11">
                        {formatDate(surgicalData.data)}
                        {surgicalData.hora && (
                          <span className="text-muted-foreground ml-2">às {surgicalData.hora}</span>
                        )}
                      </p>
                    </div>

                    {/* Local */}
                    <div className="group">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Local
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-foreground pl-11">
                        {surgicalData.unidade || "Não informado"}
                      </p>
                    </div>

                    {/* Profissional */}
                    <div className="group">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Profissional
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-foreground pl-11">
                        {surgicalData.profissional?.nome || "Não informado"}
                        {surgicalData.profissional?.crm && (
                          <span className="text-muted-foreground text-sm sm:text-base ml-2">
                            - CRM: {surgicalData.profissional.crm}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Data de Atualização */}
                  {surgicalData.dataAtualizacao && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Última atualização: <span className="font-medium">{surgicalData.dataAtualizacao}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guia de Internação */}
              <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base sm:text-lg">
                          Guia de Internação
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Acesse informações importantes sobre o processo de internação
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open('https://www.samel.com.br/guia-internacao/', '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Acessar Guia
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
