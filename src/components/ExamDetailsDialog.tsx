import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Printer, Eye, Loader2, Image, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { ExamReportView } from "@/components/ExamReportView";
import html2pdf from "html2pdf.js";

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
    console.log("🔍 Buscando detalhes do exame...");
    console.log("📍 Endpoint:", apiEndpoint);
    console.log("📋 Payload:", { idCliente, idAtendimento });
    
    setLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      let authToken = "";

      if (userToken) {
        try {
          const decoded: any = jwtDecode(userToken);
          authToken = decoded.token || "";
          console.log("🔑 Token autenticação encontrado");
        } catch (error) {
          console.error("Erro ao decodificar token:", error);
        }
      }

      console.log("🚀 Fazendo requisição para:", apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "identificador-dispositivo": "request-android",
          "chave-autenticacao": authToken,
        },
        body: JSON.stringify({
          idCliente: idCliente,
          idAtendimento: idAtendimento,
        }),
      });

      console.log("📡 Status da resposta:", response.status);

      const result = await response.json();
      console.log("📦 Resposta da API:", result);

      if (result.sucesso && result.dados) {
        console.log("✅ Detalhes carregados:", result.dados.length, "itens");
        setExamDetails(result.dados);
      } else {
        console.log("⚠️ Nenhum dado encontrado");
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

  const handleDownloadMultipleReports = async () => {
    if (selectedExamIndexes.size === 0) return;

    try {
      const element = document.getElementById('printMe');
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `laudos-multiplos-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Sucesso",
        description: "PDF com múltiplos laudos baixado com sucesso!",
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
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Detalhes dos Exames</DialogTitle>
            <DialogDescription>
              Visualize os detalhes completos dos exames realizados
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-10 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : examDetails.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhum detalhe encontrado.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
                  <Table>
                    <TableHeader>
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
                          <TableRow key={`${detail.nrSequenciaLaudoPaciente}-${index}`}>
                            <TableCell>
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
                            <TableCell className="text-right">
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
            <div className="shrink-0 px-6 py-4 border-t bg-card flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedExamIndexes.size > 0 && (
                  <span>{selectedExamIndexes.size} exame(s) selecionado(s)</span>
                )}
              </div>
              <Button 
                onClick={handleViewSelectedReports}
                disabled={selectedExamIndexes.size === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Laudos Selecionados ({selectedExamIndexes.size})
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

          <div className="shrink-0 px-6 py-4 border-t bg-card flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => setSelectedExam(null)}>
              Fechar
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Laudo
            </Button>
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

          <div className="shrink-0 px-6 py-4 border-t bg-card flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => {
              setViewingMultiple(false);
              setSelectedExamIndexes(new Set());
            }}>
              Fechar
            </Button>
            <Button variant="outline" onClick={handleDownloadMultipleReports}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Todos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
