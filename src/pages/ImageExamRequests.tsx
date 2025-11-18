import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamRequest {
  nrAtendimento: number;
  idProfissional: string;
  nrSequencia: number;
  dataEntrada: string;
  dataNascimento: string;
  dsAssinatura: string;
  dsConvenio: string;
  dsEspecialidade: string;
  dsExame: string;
  dsSetor: string;
  dsStatus: string;
  idCliente: string;
  nomeCliente: string;
  nomeProfissional: string;
  nrPedido: number;
  retornoDadosMobile: string;
}

const ImageExamRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchExamRequests = async () => {
      try {
        const listToScheduleData = localStorage.getItem("listToSchedule");
        
        if (!listToScheduleData) {
          toast({
            title: "Erro",
            description: "Dados do paciente não encontrados",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const parsedData = JSON.parse(listToScheduleData);
        const patients = parsedData.listAllPacient || parsedData;
        
        if (!Array.isArray(patients) || patients.length === 0) {
          toast({
            title: "Erro",
            description: "Nenhum paciente encontrado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const clientIds: number[] = [];
        
        patients.forEach((patient: any) => {
          if (patient.tipoBeneficiario === "Titular" && patient.clienteContratos) {
            const titular = patient.clienteContratos[0];
            if (titular?.id) {
              clientIds.push(Number(titular.id));
            }
          } else if (patient.id) {
            clientIds.push(Number(patient.id));
          }
        });

        if (clientIds.length === 0) {
          toast({
            title: "Erro",
            description: "Nenhum ID de cliente encontrado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const response = await fetch(
          "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarMeuProntuarioSolic",
          {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({
              idCliente: clientIds,
              tipo: 2,
            }),
          }
        );

        const data = await response.json();

        if (data.sucesso) {
          setRequests(data.dados || []);
        } else {
          toast({
            title: "Aviso",
            description: data.mensagem || "Nenhum pedido encontrado",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        toast({
          title: "Erro",
          description: "Erro ao buscar pedidos de exames de imagem",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExamRequests();
  }, [toast]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Pedidos de Exames de Imagem
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/exam-request-choice")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Visualize seus pedidos de exames de imagem
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum pedido de exame de imagem encontrado
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request, index) => (
                      <TableRow key={`${request.nrAtendimento}-${index}`}>
                        <TableCell>{formatDate(request.dataEntrada)}</TableCell>
                        <TableCell>{request.nomeCliente}</TableCell>
                        <TableCell>{request.nomeProfissional}</TableCell>
                        <TableCell>{request.dsEspecialidade}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.retornoDadosMobile || "-"}
                        </TableCell>
                        <TableCell>{request.dsStatus}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageExamRequests;
