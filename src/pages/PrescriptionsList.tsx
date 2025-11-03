import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Prescription {
  nr_atendimento: number;
  nrAtendimento: number;
  crm: string;
  dataEntrada: string;
  dataNascimento: string;
  dsAssinatura: string;
  dsCabecalho: string;
  dsCabecalhoPaciente: string;
  dsConvenio: string;
  dsResultado: string;
  dsSetor: string;
  endereco: string;
  idCliente: string;
  ieTipoReceita: string | null;
  ie_tipo_receita: string | null;
  isSigned: string;
  nomeCliente: string;
  nomeProfissional: string;
  nrSequencia: number;
  nr_sequencia: number;
  qrCodeDownloadReceita: string;
}

const PrescriptionsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedListToSchedule) {
      try {
        const parsedList = JSON.parse(storedListToSchedule);
        const clientIds: number[] = [];
        
        if (parsedList.listAllPacient && parsedList.listAllPacient.length > 0) {
          parsedList.listAllPacient.forEach((paciente: any) => {
            if (paciente.clienteContratos && paciente.clienteContratos.length > 0) {
              paciente.clienteContratos.forEach((contrato: any) => {
                if (contrato.id) {
                  clientIds.push(Number(contrato.id));
                }
              });
            }
            
            if (paciente.tipo === "Dependente" && paciente.id) {
              clientIds.push(Number(paciente.id));
            }
          });
        }

        if (clientIds.length > 0) {
          fetchPrescriptions(clientIds);
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

  const fetchPrescriptions = async (clientIds: number[]) => {
    try {
      const userToken = localStorage.getItem("user");
      let authToken = "";
      
      if (userToken) {
        try {
          const decoded: any = jwtDecode(userToken);
          authToken = decoded.token || "";
        } catch (error) {
          console.error("Erro ao decodificar token:", error);
        }
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarMeuProntuario2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "chave-autenticacao": authToken,
            "identificador-dispositivo": "request-android",
          },
          body: JSON.stringify({ 
            idCliente: clientIds,
            tipo: 2 
          }),
        }
      );

      const result = await response.json();

      if (result.sucesso && result.dados) {
        setPrescriptions(result.dados);
        if (result.mensagem) {
          toast({
            title: "Sucesso",
            description: result.mensagem,
          });
        }
      } else {
        toast({
          title: "Aviso",
          description: result.mensagem || "Nenhuma receita encontrada.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as receitas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (prescription: Prescription) => {
    window.open(prescription.qrCodeDownloadReceita, '_blank');
  };

  const totalPages = Math.ceil(prescriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrescriptions = prescriptions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-2xl">Minhas Receitas</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/prescriptions-and-certificates")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                voltar
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-[180px]" />
                      <Skeleton className="h-12 flex-1" />
                      <Skeleton className="h-12 w-[200px]" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhuma receita encontrada.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>CRM</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead className="text-right">Imprimir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPrescriptions.map((prescription, index) => (
                          <TableRow key={`${prescription.nrAtendimento}-${index}`} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{prescription.dataEntrada}</TableCell>
                            <TableCell>{prescription.nomeCliente}</TableCell>
                            <TableCell>{prescription.nomeProfissional}</TableCell>
                            <TableCell>{prescription.crm}</TableCell>
                            <TableCell>{prescription.dsSetor}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9"
                                onClick={() => handlePrint(prescription)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(i + 1)}
                                isActive={currentPage === i + 1}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionsList;
