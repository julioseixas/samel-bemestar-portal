import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CdiExam {
  nrAtendimento: number;
  idCliente: string;
  dsConvenio: string;
  dataEntrada: string;
  dataNascimento: string;
  medicoSolicitante: string;
  nomeCliente: string;
  dsSetor: string;
  tipo: number;
}

const CdiExams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [exams, setExams] = useState<CdiExam[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Buscar exames CDI
    if (userToken) {
      fetchCdiExams(userToken);
    }
  }, []);

  const fetchCdiExams = async (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      
      // Coleta todos os IDs de clientes (titular + dependentes)
      const clientIds = [decoded.id];
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) clientIds.push(dep.id);
        });
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoCdiMaster",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android",
            "chave-autenticacao": decoded.token || token,
          },
          body: JSON.stringify({
            idCliente: clientIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar exames CDI");
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error("Erro ao buscar exames CDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames CDI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewExam = (exam: CdiExam) => {
    toast({
      title: "Visualizar exame",
      description: `Exame de ${exam.nomeCliente} - Atendimento ${exam.nrAtendimento}`,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/exam-results")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Laudo de Exames CDI
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Centro de Diagnóstico por Imagem
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Carregando exames...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Nenhum exame CDI encontrado.</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead className="text-center">Ver exames</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam, index) => (
                    <TableRow key={`${exam.nrAtendimento}-${index}`}>
                      <TableCell>{exam.dataEntrada}</TableCell>
                      <TableCell>{exam.nomeCliente}</TableCell>
                      <TableCell>{exam.medicoSolicitante}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleViewExam(exam)}
                          className="h-10 w-10 rounded-full bg-success/10 hover:bg-success/20 text-success"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CdiExams;
