import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Eye, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/skeleton";
import html2pdf from "html2pdf.js";
import { getApiHeaders } from "@/lib/api-headers";
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
} from "@/components/ui/dialog";
import { CertificateReportView } from "@/components/CertificateReportView";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Certificate {
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

const CertificatesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
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
        
        // Aceita listToSchedule como array direto OU objeto com listAllPacient
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        if (patientList.length > 0) {
          patientList.forEach((paciente: any) => {
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
          fetchCertificates(clientIds);
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

    // Verificar se o dispositivo suporta compartilhamento
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const fetchCertificates = async (clientIds: number[]) => {
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
          headers: getApiHeaders(),
          body: JSON.stringify({ 
            idCliente: clientIds,
            tipo: 1 
          }),
        }
      );

      const result = await response.json();

      if (result.sucesso && result.dados) {
        setCertificates(result.dados);
        if (result.mensagem) {
          toast({
            title: "Sucesso",
            description: result.mensagem,
          });
        }
      } else {
        toast({
          title: "Aviso",
          description: result.mensagem || "Nenhum atestado encontrado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar atestados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os atestados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsDialogOpen(true);
  };

  const handlePrint = () => {
    if (selectedCertificate) {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!selectedCertificate) return;

    try {
      const element = document.getElementById('printMe');
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `atestado-${selectedCertificate.nrAtendimento}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Sucesso",
        description: "PDF baixado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = async () => {
    if (!selectedCertificate) return;

    try {
      const element = document.getElementById('printMe');
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `atestado-${selectedCertificate.nrAtendimento}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Gerar PDF como blob
      const pdf = await html2pdf().set(opt).from(element).output('blob');
      
      // Tentar usar Web Share API se disponível
      if (navigator.share && navigator.canShare) {
        const file = new File([pdf], `atestado-${selectedCertificate.nrAtendimento}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Atestado Médico',
            text: `Atestado - ${selectedCertificate.nomeProfissional}`,
          });
          
          toast({
            title: "Sucesso",
            description: "PDF compartilhado com sucesso!",
          });
          return;
        }
      }
      
      // Fallback: fazer download e abrir WhatsApp
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atestado-${selectedCertificate.nrAtendimento}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "PDF baixado. Por favor, anexe-o manualmente no WhatsApp.",
      });
      
      // Abrir WhatsApp com mensagem
      const message = `Olá! Segue meu atestado médico em anexo.\n\n` +
        `👤 Paciente: ${selectedCertificate.nomeCliente}\n` +
        `📅 Data: ${selectedCertificate.dataEntrada}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar o PDF.",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(certificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCertificates = certificates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Número máximo de páginas visíveis
    
    if (totalPages <= maxVisible) {
      // Se tiver poucas páginas, mostra todas
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Sempre mostra primeira página
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }
    
    // Páginas ao redor da página atual
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }
    
    // Sempre mostra última página
    pages.push(totalPages);
    
    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl">Meus Atestados</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/prescriptions-and-certificates")}
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
              ) : certificates.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum atestado encontrado.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>CRM</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead className="text-right">Ver</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentCertificates.map((certificate, index) => (
                          <TableRow key={`${certificate.nrAtendimento}-${index}`} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{certificate.dataEntrada}</TableCell>
                            <TableCell>{certificate.nomeCliente}</TableCell>
                            <TableCell>{certificate.nomeProfissional}</TableCell>
                            <TableCell>{certificate.crm}</TableCell>
                            <TableCell>{certificate.dsSetor}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9"
                                onClick={() => handleView(certificate)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full h-full sm:max-w-[95vw] sm:h-[90vh] flex flex-col p-0 max-w-none sm:rounded-lg">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-card shrink-0">
            <DialogTitle className="text-base sm:text-xl">
              Atestado - {selectedCertificate?.nomeProfissional}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
            {selectedCertificate && (
              <CertificateReportView
                certificateData={{
                  nrAtendimento: selectedCertificate.nrAtendimento,
                  dsResultado: selectedCertificate.dsResultado,
                  nomeCliente: selectedCertificate.nomeCliente,
                  dataNascimento: selectedCertificate.dataNascimento,
                  dsConvenio: selectedCertificate.dsConvenio,
                  dsSetor: selectedCertificate.dsSetor,
                  nomeProfissional: selectedCertificate.nomeProfissional,
                  dataEntrada: selectedCertificate.dataEntrada,
                  dsAssinatura: selectedCertificate.dsAssinatura,
                  qrCodeDownloadReceita: selectedCertificate.qrCodeDownloadReceita,
                }}
                documentType="atestado"
              />
            )}
          </div>

          <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-card flex justify-end gap-2 print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="icon" className="h-9 w-9">
                    <span className="sr-only">Fechar</span>
                    <span className="text-lg">✕</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fechar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleDownload} size="icon" className="h-9 w-9">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Baixar PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixar PDF</p>
                </TooltipContent>
              </Tooltip>

              {canShare && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleShareWhatsApp} size="icon" className="h-9 w-9">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Compartilhar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compartilhar</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handlePrint} size="icon" className="h-9 w-9">
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">Imprimir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Imprimir</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificatesList;
