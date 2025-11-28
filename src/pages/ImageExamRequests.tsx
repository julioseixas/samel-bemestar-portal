import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";
import { AnimatedHourglass } from "@/components/AnimatedHourglass";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  PaginationEllipsis,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ExamRequestView } from "@/components/ExamRequestView";
import { Download, Share2, Printer, X } from "lucide-react";
import html2pdf from "html2pdf.js";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ExamRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
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

    // Verificar se o dispositivo suporta compartilhamento de arquivos
    const checkShareSupport = () => {
      if (!navigator.share || !navigator.canShare) {
        return false;
      }
      
      // Criar um arquivo de teste para verificar suporte
      try {
        const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        return navigator.canShare({ files: [testFile] });
      } catch {
        return false;
      }
    };
    
    setCanShare(checkShareSupport());
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

  const handleDownloadPDF = async () => {
    if (!selectedRequest) return;
    const element = document.getElementById("printMe");
    const options = {
      margin: 0.5,
      filename: `pedido_exame_imagem_${selectedRequest.nrAtendimento}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
    };
    html2pdf().set(options).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!selectedRequest) return;
    const element = document.getElementById("printMe");
    const options = {
      margin: 0.5,
      filename: `pedido_exame_imagem_${selectedRequest.nrAtendimento}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
    };

    try {
      const pdfBlob = await html2pdf().set(options).from(element).outputPdf("blob");
      const file = new File([pdfBlob], `pedido_exame_imagem_${selectedRequest.nrAtendimento}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Pedido de Exame de Imagem",
        });
      } else {
        toast({
          title: "Compartilhamento não disponível",
          description: "Seu dispositivo não suporta compartilhamento de arquivos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o documento.",
        variant: "destructive",
      });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }
    
    pages.push(totalPages);
    
    return pages;
  };

  const getStatusIcon = (status: string) => {
    if (status === "Pendente") {
      return (
        <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <AnimatedHourglass className="h-5 w-5 text-warning" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status}</p>
        </TooltipContent>
      </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl">Pedidos de Exames de Imagem</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/exam-request-choice")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {loading ? (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-[180px]" />
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-[200px]" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum pedido de exame de imagem encontrado.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-6 text-sm text-muted-foreground border-b pb-3">
                    <div className="flex items-center gap-2">
                      <AnimatedHourglass className="h-4 w-4 text-warning" />
                      <span>Pendente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Coletado</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>Especialidade</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Ver</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRequests.map((request, index) => (
                          <TableRow 
                            key={`${request.nrAtendimento}-${index}`}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{formatDate(request.dataEntrada)}</TableCell>
                            <TableCell>{request.nomeCliente}</TableCell>
                            <TableCell>{request.nomeProfissional}</TableCell>
                            <TableCell>{request.dsEspecialidade}</TableCell>
                            <TableCell className="text-center">
                              {getStatusIcon(request.dsStatus)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9"
                                onClick={() => handleViewDetails(request)}
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
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, i) => (
                        <PaginationItem key={`${page}-${i}`}>
                          {typeof page === 'number' ? (
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
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

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-[95vw] max-h-[75vh] sm:max-h-[95vh] overflow-hidden flex flex-col p-4">
          <DialogHeader className="border-b pb-3 mx-0">
            <DialogTitle className="text-xl">Pedido de Exame de Imagem</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedRequest && (
              <ExamRequestView examData={selectedRequest} />
            )}
          </div>
          <DialogFooter className="border-t pt-3 flex flex-row justify-between gap-2 sm:gap-3 mx-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fechar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex gap-2 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownloadPDF}
                      className="h-9 w-9"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Baixar PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {canShare && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="h-9 w-9"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Compartilhar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrint}
                      className="h-9 w-9"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Imprimir</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageExamRequests;
