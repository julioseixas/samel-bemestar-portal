import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, TrendingUp } from "lucide-react";
import { ExamDetailsDialog } from "@/components/ExamDetailsDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Patient {
  id: string;
  nome: string;
  tipo: string;
  cdPessoaFisica?: string;
}

interface LabProgressExam {
  CD_PESSOA_FISICA: string;
  NR_SEQ_EXAME: number;
  NM_EXAME: string;
  DS_UNIDADE_MEDIDA: string;
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
  
  // Estados para progressão laboratorial
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressExams, setProgressExams] = useState<LabProgressExam[]>([]);
  const [selectedProgressExam, setSelectedProgressExam] = useState<string>("");
  const [loadingProgressExams, setLoadingProgressExams] = useState(false);

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
        const patientsList: Patient[] = [];
        
        if (parsedList.listAllPacient && parsedList.listAllPacient.length > 0) {
          parsedList.listAllPacient.forEach((paciente: any) => {
            // Monta a lista de pacientes para a tabela de progressão
            patientsList.push({
              id: paciente.cdPessoaFisica || paciente.id,
              nome: paciente.nome,
              tipo: paciente.tipo || "Titular",
              cdPessoaFisica: paciente.cdPessoaFisica || paciente.id
            });

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

        setPatients(patientsList);

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

  const handleViewProgress = async (patient: Patient) => {
    setSelectedPatient(patient);
    setProgressDialogOpen(true);
    setSelectedProgressExam("");
    setProgressExams([]);
    
    if (patient.cdPessoaFisica) {
      await fetchProgressExams(patient.cdPessoaFisica);
    }
  };

  const fetchProgressExams = async (cdPessoaFisica: string) => {
    setLoadingProgressExams(true);
    try {
      const response = await fetch(
        `https://api-prontuario.samel.com.br/unidade/prontuario/exames/buscarExamesLabPaciente?cd_pessoa_fisica=${cdPessoaFisica}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar exames laboratoriais");
      }

      const data = await response.json();
      setProgressExams(data);
    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames laboratoriais.",
        variant: "destructive",
      });
    } finally {
      setLoadingProgressExams(false);
    }
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

          {/* Tabela de Pacientes para Progressão Laboratorial */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Progressão Laboratorial por Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Ver Progressão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient, index) => (
                        <TableRow key={`${patient.id}-${index}`} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{patient.nome}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              patient.tipo === "Titular" 
                                ? "bg-primary/10 text-primary" 
                                : "bg-secondary/10 text-secondary-foreground"
                            }`}>
                              {patient.tipo}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9"
                              onClick={() => handleViewProgress(patient)}
                            >
                              <TrendingUp className="h-4 w-4" />
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

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Laudo de Exames Laboratoriais</CardTitle>
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

      {/* Dialog de Progressão Laboratorial */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Progressão Laboratorial - {selectedPatient?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um exame para visualizar sua progressão ao longo do tempo.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exame</label>
              <Select
                value={selectedProgressExam}
                onValueChange={setSelectedProgressExam}
                disabled={loadingProgressExams || progressExams.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingProgressExams ? "Carregando exames..." : "Selecione um exame"} />
                </SelectTrigger>
                <SelectContent>
                  {progressExams.map((exam) => (
                    <SelectItem
                      key={`${exam.NR_SEQ_EXAME}-${exam.NM_EXAME}`}
                      value={exam.NR_SEQ_EXAME.toString()}
                    >
                      {exam.NM_EXAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {progressExams.length === 0 && !loadingProgressExams && (
              <p className="text-sm text-muted-foreground">
                Nenhum exame laboratorial encontrado para este paciente.
              </p>
            )}

            {selectedProgressExam && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Exame selecionado: <span className="font-semibold text-foreground">
                    {progressExams.find(e => e.NR_SEQ_EXAME.toString() === selectedProgressExam)?.NM_EXAME}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unidade de medida: <span className="font-semibold text-foreground">
                    {progressExams.find(e => e.NR_SEQ_EXAME.toString() === selectedProgressExam)?.DS_UNIDADE_MEDIDA}
                  </span>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabExams;
