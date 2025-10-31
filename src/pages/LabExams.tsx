import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LabExam {
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

const LabExams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [exams, setExams] = useState<LabExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SECRET_KEY = '9j7d8k20f##';
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        // Decodifica o titular para pegar o nome
        const decodedTitular: any = jwt.verify(storedTitular, SECRET_KEY);
        setPatientName(decodedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao decodificar titular:", error);
      }
    }

    if (storedListToSchedule) {
      try {
        // Decodifica a lista de pacientes para pegar os IDs
        const decodedList: any = jwt.verify(storedListToSchedule, SECRET_KEY);
        const clientIds: number[] = [];
        
        if (decodedList.listAllPacient && decodedList.listAllPacient.length > 0) {
          decodedList.listAllPacient.forEach((paciente: any) => {
            // Pega o ID do titular (de clienteContratos)
            if (paciente.clienteContratos && paciente.clienteContratos.length > 0) {
              paciente.clienteContratos.forEach((contrato: any) => {
                if (contrato.id) {
                  clientIds.push(Number(contrato.id));
                }
              });
            }
            
            // Pega o ID do dependente diretamente se existir
            if (paciente.tipo === "Dependente" && paciente.id) {
              clientIds.push(Number(paciente.id));
            }
          });
        }

        if (clientIds.length > 0) {
          fetchLabExams(clientIds);
        } else {
          toast({
            title: "Erro",
            description: "Nenhum ID de cliente encontrado",
            variant: "destructive",
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao processar lista de pacientes:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }
  }, []);

  const fetchLabExams = async (clientIds: number[]) => {
    try {
      const SECRET_KEY = '9j7d8k20f##';
      // Obter e decodificar o JWT para pegar a chave de autenticação
      const userToken = localStorage.getItem("user");
      let authToken = "";
      
      if (userToken) {
        try {
          const decoded: any = jwt.verify(userToken, SECRET_KEY);
          authToken = decoded.chave || "";
        } catch (error) {
          console.error("Erro ao decodificar token:", error);
        }
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoLabMaster",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "chave-autenticacao": authToken,
            "identificador-dispositivo": "request-android",
          },
          body: JSON.stringify({ idCliente: clientIds }),
        }
      );

      const result = await response.json();

      if (result.sucesso && result.dados) {
        setExams(result.dados);
      } else {
        toast({
          title: "Aviso",
          description: result.mensagem || "Nenhum exame encontrado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames laboratoriais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (exam: LabExam) => {
    toast({
      title: "Detalhes do Exame",
      description: "Funcionalidade de visualização de detalhes em desenvolvimento.",
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

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Laudo de Exames Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Carregando exames...</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum exame encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam, index) => (
                        <TableRow key={`${exam.nrAtendimento}-${index}`}>
                          <TableCell>{exam.dataEntrada}</TableCell>
                          <TableCell>{exam.nomeCliente}</TableCell>
                          <TableCell>{exam.medicoSolicitante}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(exam)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LabExams;
