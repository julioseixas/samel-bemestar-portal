import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { ExamDetailsDialog } from "@/components/ExamDetailsDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
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
  const [jwtInfo, setJwtInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedExam, setSelectedExam] = useState<LabExam | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const userToken = localStorage.getItem("user");

    // Decodifica o JWT para mostrar informações técnicas
    if (userToken) {
      try {
        const decoded: any = jwtDecode(userToken);
        setJwtInfo(decoded);
      } catch (error) {
        console.error("Erro ao decodificar JWT:", error);
      }
    }

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
      // Decodificar o JWT para pegar a chave de autenticação
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
    console.log("👆 Clique no botão Ver Exames detectado!");
    console.log("📋 Exame selecionado:", exam);
    setSelectedExam(exam);
    setDialogOpen(true);
    console.log("✅ Estado atualizado: dialogOpen = true");
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
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/exam-results")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {jwtInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Informações Técnicas do JWT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Token/Chave:</span>
                    <span className="font-mono break-all text-xs">{jwtInfo.token || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Tipo Beneficiário:</span>
                    <span>{jwtInfo.tipoBeneficiario}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Nome:</span>
                    <span>{jwtInfo.nome}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">ID:</span>
                    <span>{jwtInfo.id}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Email:</span>
                    <span>{jwtInfo.usuario?.email}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">ID Usuário:</span>
                    <span>{jwtInfo.usuario?.id}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Rating:</span>
                    <span>{typeof jwtInfo.rating === 'object' ? JSON.stringify(jwtInfo.rating) : jwtInfo.rating}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Dependentes:</span>
                    <span>{jwtInfo.dependentes?.length || 0}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold">Contratos:</span>
                    <span>{jwtInfo.clienteContratos?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                        <TableHead className="text-right">Ver exames</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentExams.map((exam, index) => (
                        <TableRow key={`${exam.nrAtendimento}-${index}`} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{exam.dataEntrada}</TableCell>
                          <TableCell>{exam.nomeCliente}</TableCell>
                          <TableCell className="text-primary">{exam.medicoSolicitante}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-9 w-9"
                              onClick={() => handleViewDetails(exam)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && exams.length > itemsPerPage && (
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
                    Página {currentPage} de {totalPages} ({exams.length} exames)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <ExamDetailsDialog
        open={dialogOpen && !!selectedExam}
        onOpenChange={setDialogOpen}
        idCliente={selectedExam?.idCliente || ""}
        idAtendimento={selectedExam?.nrAtendimento || 0}
        apiEndpoint="https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoLabDetalhe"
      />
    </div>
  );
};

export default LabExams;
