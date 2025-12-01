import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { ExamDetailsDialog } from "@/components/ExamDetailsDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiHeaders } from "@/lib/api-headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedExam, setSelectedExam] = useState<CdiExam | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
          headers: getApiHeaders(),
          body: JSON.stringify({
            idCliente: clientIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar exames CDI");
      }

      const data = await response.json();
      if (data.sucesso && data.dados) {
        setExams(data.dados);
      } else {
        setExams([]);
      }
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
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  // Cálculos de paginação
  const totalPages = Math.ceil(exams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExams = exams.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 sm:p-6 border-b">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  Laudo de Exames de Imagem
                </h2>
                <p className="text-xs sm:text-base text-muted-foreground truncate">
                  Centro de Diagnóstico por Imagem
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/exam-results")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm shrink-0"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>

          {loading ? (
            <>
              {/* Desktop skeleton */}
              <div className="hidden md:block overflow-x-auto max-h-[60vh] overflow-y-auto">
                <div className="p-6 space-y-4">
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
              
              {/* Mobile skeleton */}
              <div className="md:hidden space-y-3 p-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
            </>
          ) : exams.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Nenhum exame de imagem encontrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block max-h-[60vh] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead className="text-center">Ver exames</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentExams.map((exam, index) => (
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

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-3 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] md:max-h-[60vh] overflow-y-auto">
                {currentExams.map((exam, index) => (
                  <div
                    key={`${exam.nrAtendimento}-${index}`}
                    className="rounded-lg border bg-card p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Data</span>
                      <span className="text-sm font-semibold">{exam.dataEntrada}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Paciente</p>
                      <p className="text-sm font-medium">{exam.nomeCliente}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Médico</p>
                      <p className="text-sm">{exam.medicoSolicitante}</p>
                    </div>
                    <Button
                      onClick={() => handleViewExam(exam)}
                      className="w-full min-h-[44px] bg-success hover:bg-success/90 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver exames
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
          {!loading && exams.length > itemsPerPage && (
                <>
                  <Separator className="mt-6" />
                  <div className="p-6">
                    <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">Anterior</span>
                        </Button>
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
                        >
                          <span className="hidden sm:inline mr-2">Próximo</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Página {currentPage} de {totalPages} ({exams.length} exames)
                  </p>
                  </div>
                </>
              )}
          </div>
        </div>
      </main>

      <ExamDetailsDialog
        open={dialogOpen && !!selectedExam}
        onOpenChange={setDialogOpen}
        idCliente={selectedExam?.idCliente || ""}
        idAtendimento={selectedExam?.nrAtendimento || 0}
        apiEndpoint="https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoCdiDetalhe"
      />
    </div>
  );
};

export default CdiExams;
