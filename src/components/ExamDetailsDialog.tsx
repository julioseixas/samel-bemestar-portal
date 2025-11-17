import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiHeaders } from "@/lib/api-headers";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Eye, Loader2, Image, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { ExamReportView } from "@/components/ExamReportView";
import html2pdf from "html2pdf.js";
import samelLogo from "@/assets/samel-logo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExamDetail {
  nrSequenciaLaudoPaciente: number;
  nrAtendimento: number;
  dataEntrada: string;
  dataNascimento: string;
  nomeCliente: string;
  nomeProfissional: string;
  dsConvenio: string;
  dsSetor: string;
  idCliente: string;
  dsCabecalho: string;
  dsResultado: string;
  dsAssinatura: string;
  medicoSolicitante: string;
  medicoLaudo: string;
  cd_medico_solic?: string;
  nm_medico_solic?: string;
  procedimentoExame: string;
  dtLaudo?: string;
  dtLiberacao: string;
  // Campos adicionais do CDI
  ds_titulo_laudo?: string;
  cdMedicoLaudo?: string;
  urlImg?: string;
}

interface ExamDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idCliente: string;
  idAtendimento: number;
  apiEndpoint: string;
}

export function ExamDetailsDialog({
  open,
  onOpenChange,
  idCliente,
  idAtendimento,
  apiEndpoint,
}: ExamDetailsDialogProps) {
  const [examDetails, setExamDetails] = useState<ExamDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [selectedExamIndexes, setSelectedExamIndexes] = useState<Set<number>>(new Set());
  const [viewingMultiple, setViewingMultiple] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();

  // Cálculos de paginação
  const totalPages = Math.ceil(examDetails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExams = examDetails.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Chama a API quando o dialog abrir
  useEffect(() => {
    if (open && !selectedExam) {
      setCurrentPage(1);
      fetchExamDetails();
    }
  }, [open]);

  const fetchExamDetails = async () => {
    setLoading(true);
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

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          idCliente: idCliente,
          idAtendimento: idAtendimento,
        }),
      });

      const result = await response.json();

      if (result.sucesso && result.dados) {
        setExamDetails(result.dados);
      } else {
        toast({
          title: "Aviso",
          description: result.mensagem || "Nenhum detalhe encontrado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao buscar detalhes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do exame.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (exam: ExamDetail) => {
    setSelectedExam(exam);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = async () => {
    if (!selectedExam) return;

    try {
      const element = document.getElementById('printMe');
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `laudo-${selectedExam.nrAtendimento}-${selectedExam.procedimentoExame}.pdf`,
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

  const handleShareWhatsApp = async (exam?: ExamDetail) => {
    const examToShare = exam || selectedExam;
    if (!examToShare) return;

    try {
      const element = document.getElementById('printMe');
      if (!element) return;

      const tipoExame = apiEndpoint.includes("Lab") ? "Laboratorial" : "CDI";
      const opt = {
        margin: 10,
        filename: `laudo-${examToShare.nrAtendimento}-${examToShare.procedimentoExame}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Gerar PDF como blob
      const pdf = await html2pdf().set(opt).from(element).output('blob');
      
      // Tentar usar Web Share API se disponível
      if (navigator.share && navigator.canShare) {
        const file = new File([pdf], `laudo-${examToShare.nrAtendimento}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Laudo de Exame ${tipoExame}`,
            text: `Laudo - ${examToShare.procedimentoExame}`,
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
      a.download = `laudo-${examToShare.nrAtendimento}-${examToShare.procedimentoExame}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "PDF baixado. Por favor, anexe-o manualmente no WhatsApp.",
      });
      
      // Abrir WhatsApp com mensagem
      const message = `Olá! Segue o resultado do meu exame ${tipoExame} em anexo.\n\n` +
        `📋 Exame: ${examToShare.procedimentoExame}\n` +
        `📅 Data: ${examToShare.dataEntrada}`;
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

  const handleDownloadMultipleReports = async () => {
    if (selectedExamIndexes.size === 0) return;

    try {
      const selectedExams = getSelectedExams();
      
      toast({
        title: "Iniciando downloads",
        description: `Baixando ${selectedExams.length} laudo(s)...`,
      });

      // Baixar cada exame individualmente
      for (let i = 0; i < selectedExams.length; i++) {
        const exam = selectedExams[i];
        
        // Criar um elemento temporário com o conteúdo do exame
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-print-element';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Renderizar o conteúdo do exame no elemento temporário
        const examContent = `
          <div style="background: white; padding: 24px; max-width: 800px; margin: 0 auto;">
            <div style="display: flex; margin-bottom: 16px; border: 1px solid #e5e7eb;">
              <div style="width: 150px; border-right: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; padding: 16px;">
                <img src="${samelLogo}" alt="Samel Logo" style="width: 100%; height: auto; max-height: 100px; object-fit: contain;" />
              </div>
              <div style="flex: 1; padding: 16px;">
                <h5 style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                  SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA
                </h5>
                <p style="text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  Rua Joaquim Nabuco, 1755 - Manaus - AM - CEP 69020030 - Fone: 21292200
                </p>
                <p style="text-align: center; font-size: 12px; color: #6b7280;">
                  CRF-RS 5-11649 CNPJ: 04159778000107
                </p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 12px;">
                <p style="text-align: center; font-weight: bold;">EXAMES</p>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; border-left: 0; padding: 12px;">
                <p style="text-align: center;">
                  <span style="font-weight: bold;">ATENDIMENTO: </span>
                  <span style="font-weight: bold;">${exam.nrAtendimento}</span>
                </p>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <div style="border: 1px solid #e5e7eb; padding: 8px 16px;">
                <p style="text-align: center;">
                  <span style="font-weight: bold;">Médico(a) Solicitante: </span>
                  ${exam.medicoSolicitante}
                </p>
              </div>
            </div>
            <div style="border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 16px; min-height: 200px;">
              ${exam.dsResultado || exam.dsCabecalho}
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 8px 16px;">
                <p style="margin-bottom: 4px;">
                  <span style="font-weight: bold;">Paciente: </span>
                  ${exam.nomeCliente}
                </p>
                <p>
                  <span style="font-weight: bold;">Data Nasc: </span>
                  ${exam.dataNascimento}
                </p>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; border-left: 0; padding: 8px 16px;">
                <p style="margin-bottom: 4px;">
                  <span style="font-weight: bold;">Convênio: </span>
                  ${exam.dsConvenio}
                </p>
                <p>
                  <span style="font-weight: bold;">Setor: </span>
                  ${exam.dsSetor}
                </p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="flex: 2; border: 1px solid #e5e7eb; padding: 8px 16px;">
                <p style="text-align: center; margin-bottom: 4px;">
                  <span style="font-weight: bold;">
                    ${apiEndpoint.includes("Lab") ? "Analista Clínico: " : "Médico(a): "}
                  </span>
                  ${exam.medicoLaudo}
                </p>
                <p style="text-align: center;">
                  <span style="font-weight: bold;">Data de Entrada: </span>
                  ${exam.dataEntrada}
                </p>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; border-left: 0; padding: 8px 16px;">
                <p style="font-weight: bold; margin-bottom: 4px;">Assinatura:</p>
                <div style="text-align: center;">
                  ${exam.dsAssinatura || ""}
                </div>
              </div>
            </div>
            <div style="text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              <p>Este documento é válido somente com assinatura digital ou física do profissional responsável</p>
            </div>
          </div>
        `;
        
        tempDiv.innerHTML = examContent;

        const opt = {
          margin: 10,
          filename: `laudo-${exam.nrAtendimento}-${exam.procedimentoExame.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        await html2pdf().set(opt).from(tempDiv).save();
        
        // Remover o elemento temporário
        document.body.removeChild(tempDiv);
        
        // Pequeno delay entre downloads para não sobrecarregar o navegador
        if (i < selectedExams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "Sucesso",
        description: `${selectedExams.length} laudo(s) baixado(s) com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao gerar PDFs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os PDFs.",
        variant: "destructive",
      });
    }
  };

  const handleToggleExam = (index: number) => {
    const newSelected = new Set(selectedExamIndexes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedExamIndexes(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedExamIndexes.size === currentExams.length) {
      setSelectedExamIndexes(new Set());
    } else {
      const allIndexes = currentExams.map((_, i) => startIndex + i);
      setSelectedExamIndexes(new Set(allIndexes));
    }
  };

  const handleViewSelectedReports = () => {
    if (selectedExamIndexes.size === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um exame para visualizar.",
        variant: "destructive",
      });
      return;
    }
    setViewingMultiple(true);
  };

  const getSelectedExams = () => {
    return Array.from(selectedExamIndexes)
      .sort((a, b) => a - b)
      .map(index => examDetails[index]);
  };

  return (
    <>
      <Dialog
        open={open && !selectedExam && !viewingMultiple}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onOpenChange(false);
            setExamDetails([]);
            setCurrentPage(1);
            setSelectedExamIndexes(new Set());
          }
        }}
      >
        <DialogContent className="w-full h-full sm:max-w-[90vw] sm:h-[90vh] flex flex-col p-0 max-w-none sm:rounded-lg">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b">
            <DialogTitle className="text-base sm:text-lg">Detalhes dos Exames</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Visualize os detalhes completos dos exames realizados
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full sm:w-[250px]" />
                      <Skeleton className="h-4 w-3/4 sm:w-[200px]" />
                    </div>
                    <Skeleton className="h-10 w-[100px] hidden sm:block" />
                  </div>
                ))}
              </div>
            ) : examDetails.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum detalhe encontrado.</p>
              </div>
            ) : (
              <>
                {/* Desktop: Table view */}
                <div className="hidden md:block rounded-lg border bg-card shadow-soft overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedExamIndexes.size === currentExams.length && currentExams.length > 0}
                            onCheckedChange={handleToggleAll}
                            aria-label="Selecionar todos"
                          />
                        </TableHead>
                        <TableHead>Exame</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Data de Liberação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentExams.map((detail, index) => {
                        const globalIndex = startIndex + index;
                        return (
                          <TableRow 
                            key={`${detail.nrSequenciaLaudoPaciente}-${index}`}
                            className="cursor-pointer"
                            onClick={(e) => {
                              // Não selecionar se clicar nos botões
                              if ((e.target as HTMLElement).closest('button')) return;
                              handleToggleExam(globalIndex);
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedExamIndexes.has(globalIndex)}
                                onCheckedChange={() => handleToggleExam(globalIndex)}
                                aria-label={`Selecionar ${detail.procedimentoExame}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {detail.procedimentoExame}
                            </TableCell>
                            <TableCell>{detail.nomeCliente}</TableCell>
                            <TableCell>{detail.nomeProfissional}</TableCell>
                            <TableCell>{detail.dtLiberacao}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReport(detail)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Laudo
                                </Button>
                                {detail.urlImg && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(detail.urlImg, '_blank')}
                                    className="bg-primary/10 hover:bg-primary/20 text-primary"
                                  >
                                    <Image className="h-4 w-4 mr-2" />
                                    Ver Imagem
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: Card view */}
                <div className="md:hidden space-y-3">
                  {currentExams.map((detail, index) => {
                    const globalIndex = startIndex + index;
                    return (
                      <div 
                        key={`${detail.nrSequenciaLaudoPaciente}-${index}`} 
                        className="bg-card border rounded-lg p-4 space-y-3 cursor-pointer active:bg-muted/50"
                        onClick={(e) => {
                          // Não selecionar se clicar nos botões ou checkbox
                          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) return;
                          handleToggleExam(globalIndex);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedExamIndexes.has(globalIndex)}
                                onCheckedChange={() => handleToggleExam(globalIndex)}
                                aria-label={`Selecionar ${detail.procedimentoExame}`}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 line-clamp-2">{detail.procedimentoExame}</h4>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <p><span className="font-medium">Paciente:</span> {detail.nomeCliente}</p>
                                <p><span className="font-medium">Médico:</span> {detail.nomeProfissional}</p>
                                <p><span className="font-medium">Liberação:</span> {detail.dtLiberacao}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReport(detail)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Laudo
                          </Button>
                          {detail.urlImg && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(detail.urlImg, '_blank')}
                              className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs"
                            >
                              <Image className="h-3 w-3 mr-1" />
                              Imagem
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {examDetails.length > itemsPerPage && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNumber)}
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Página {currentPage} de {totalPages} ({examDetails.length} exames)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && examDetails.length > 0 && (
            <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-card flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {selectedExamIndexes.size > 0 && (
                  <span>{selectedExamIndexes.size} exame(s) selecionado(s)</span>
                )}
              </div>
              <Button 
                onClick={handleViewSelectedReports}
                disabled={selectedExamIndexes.size === 0}
                className="w-full sm:w-auto text-xs sm:text-sm"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Laudos ({selectedExamIndexes.size})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedExam}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedExam(null);
        }}
      >
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
            <DialogTitle className="text-xl">
              Laudo - {selectedExam?.procedimentoExame}
            </DialogTitle>
            <DialogDescription>
              Laudo completo do exame com informações do paciente e resultado
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedExam && (
              <ExamReportView
                examData={{
                  ...selectedExam,
                  dsResultado: selectedExam.dsResultado || selectedExam.dsCabecalho
                }}
                tipoLaudo={apiEndpoint.includes("Lab") ? "lab" : "cdi"}
              />
            )}
          </div>

          <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-card flex justify-end gap-2 print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setSelectedExam(null)} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <span className="sr-only">Fechar</span>
                    <span className="text-base sm:text-lg">✕</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fechar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleDownloadReport} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Baixar PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixar PDF</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => handleShareWhatsApp()} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Compartilhar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compartilhar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handlePrintReport} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      <Dialog
        open={viewingMultiple}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingMultiple(false);
            setSelectedExamIndexes(new Set());
          }
        }}
      >
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
            <DialogTitle className="text-xl">
              Laudos Selecionados ({selectedExamIndexes.size} exames)
            </DialogTitle>
            <DialogDescription>
              Visualização de múltiplos laudos em sequência
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {getSelectedExams().map((exam, index) => (
              <div key={`report-${index}`} className="mb-8 pb-8 border-b last:border-b-0">
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  Exame {index + 1}: {exam.procedimentoExame}
                </h3>
                <ExamReportView
                  examData={{
                    ...exam,
                    dsResultado: exam.dsResultado || exam.dsCabecalho
                  }}
                  tipoLaudo={apiEndpoint.includes("Lab") ? "lab" : "cdi"}
                />
              </div>
            ))}
          </div>

          <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-card flex justify-end gap-2 print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    setViewingMultiple(false);
                    setSelectedExamIndexes(new Set());
                  }} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <span className="sr-only">Fechar</span>
                    <span className="text-base sm:text-lg">✕</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fechar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleDownloadMultipleReports} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Baixar PDFs</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixar PDFs</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    const selectedExams = getSelectedExams();
                    if (selectedExams.length > 0) {
                      handleShareWhatsApp(selectedExams[0]);
                    }
                  }} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Compartilhar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compartilhar</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handlePrintReport} size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
    </>
  );
}
