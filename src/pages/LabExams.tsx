import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
        
        // Collect all client IDs
        const clientIds: number[] = [];
        
        // Add main client ID from clienteContratos
        if (data.clienteContratos && Array.isArray(data.clienteContratos)) {
          data.clienteContratos.forEach((contrato: any) => {
            if (contrato.id) {
              clientIds.push(Number(contrato.id));
            }
          });
        }
        
        // Add dependent IDs
        if (data.dependentes && Array.isArray(data.dependentes)) {
          data.dependentes.forEach((dep: any) => {
            if (dep.id) {
              clientIds.push(Number(dep.id));
            }
          });
        }
        
        // Fetch lab exams
        fetchLabExams(clientIds);
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }
  }, []);

  const fetchLabExams = async (clientIds: number[]) => {
    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoLabMaster",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
