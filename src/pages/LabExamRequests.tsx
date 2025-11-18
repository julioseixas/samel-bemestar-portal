import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Eye } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const LabExamRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ExamRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const itemsPerPage = 10;

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
              tipo: 1,
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
          description: "Erro ao buscar pedidos de exames laboratoriais",
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

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewDetails = (request: ExamRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:px-6 md:py-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Pedidos de Exames Laboratoriais
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/exam-request-choice")}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              size="sm"
            >
              ← Voltar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum pedido de exame laboratorial encontrado
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Data</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Paciente</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Profissional</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Especialidade</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRequests.map((request, index) => (
                      <TableRow 
                        key={`${request.nrAtendimento}-${index}`}
                        className="border-b border-border hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-medium">{formatDate(request.dataEntrada)}</TableCell>
                        <TableCell>{request.nomeCliente}</TableCell>
                        <TableCell>{request.nomeProfissional}</TableCell>
                        <TableCell>{request.dsEspecialidade}</TableCell>
                        <TableCell>{request.dsStatus}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(request)}
                            className="h-9 w-9 rounded-full bg-success/20 hover:bg-success/30 text-success"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={`cursor-pointer border-border ${
                            currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"
                          }`}
                        >
                          Anterior
                        </PaginationPrevious>
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer border-border hover:bg-accent"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            className="cursor-pointer border-border hover:bg-accent"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={`cursor-pointer border-border ${
                            currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"
                          }`}
                        >
                          Próximo
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedRequest.dataEntrada)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedRequest.dsStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{selectedRequest.nomeCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                  <p className="font-medium">{selectedRequest.nomeProfissional}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Especialidade</p>
                  <p className="font-medium">{selectedRequest.dsEspecialidade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium">{selectedRequest.dsSetor || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Detalhes</p>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedRequest.retornoDadosMobile || "Nenhum detalhe disponível"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabExamRequests;
