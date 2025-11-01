import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LabExam {
  CD_PESSOA_FISICA: string;
  NR_SEQ_EXAME: number;
  NM_EXAME: string;
  DS_UNIDADE_MEDIDA: string;
}

const LabProgress = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [labExams, setLabExams] = useState<LabExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string>("");

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    const userToken = localStorage.getItem("user");

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

    if (userToken) {
      try {
        const decoded: any = jwtDecode(userToken);
        const id = decoded.cd_pessoa_fisica || decoded.id;
        setPatientId(id);
        if (id) {
          fetchLabExams(id);
        }
      } catch (error) {
        console.error("Erro ao decodificar JWT:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do paciente.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const fetchLabExams = async (cdPessoaFisica: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api-prontuario.samel.com.br/unidade/prontuario/exames/buscarExamesLabPaciente?cd_pessoa_fisica=${cdPessoaFisica}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar exames laboratoriais");
      }

      const data = await response.json();
      setLabExams(data);
    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames laboratoriais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Progressão de Exames Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-4 text-muted-foreground">
                  Selecione um exame para visualizar sua progressão ao longo do tempo.
                </p>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Exame</label>
                  <Select
                    value={selectedExam}
                    onValueChange={setSelectedExam}
                    disabled={isLoading || labExams.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoading ? "Carregando exames..." : "Selecione um exame"} />
                    </SelectTrigger>
                    <SelectContent>
                      {labExams.map((exam) => (
                        <SelectItem
                          key={`${exam.NR_SEQ_EXAME}-${exam.NM_EXAME}`}
                          value={exam.NR_SEQ_EXAME.toString()}
                        >
                          {exam.NM_EXAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {labExams.length === 0 && !isLoading && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nenhum exame laboratorial encontrado.
                  </p>
                )}

                {selectedExam && (
                  <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      Exame selecionado: <span className="font-semibold text-foreground">
                        {labExams.find(e => e.NR_SEQ_EXAME.toString() === selectedExam)?.NM_EXAME}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Unidade de medida: <span className="font-semibold text-foreground">
                        {labExams.find(e => e.NR_SEQ_EXAME.toString() === selectedExam)?.DS_UNIDADE_MEDIDA}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LabProgress;
