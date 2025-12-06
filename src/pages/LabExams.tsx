import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ExamDetailsDialog } from "@/components/ExamDetailsDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiHeaders } from "@/lib/api-headers";
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
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

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

interface ExamProgressionData {
  CD_PESSOA_FISICA: string;
  NR_ATENDIMENTO: number;
  NR_PRESCRICAO: number;
  NR_SEQ_EXAME: number;
  NM_EXAME: string;
  DS_RESULTADO: number;
  DS_UNIDADE_MEDIDA: string;
  DT_RESULTADO: string;
  QT_MINIMA: number;
  QT_MAXIMA: number;
  DS_REFERENCIA: string;
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
  const [examProgressionData, setExamProgressionData] = useState<ExamProgressionData[]>([]);
  const [loadingProgression, setLoadingProgression] = useState(false);

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
        
        // Aceita listToSchedule como array direto OU objeto com listAllPacient
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        if (patientList.length > 0) {
          patientList.forEach((paciente: any) => {
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
          headers: getApiHeaders(),
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
        `https://api-prontuario.samel.com.br/prontuario/exames/buscarExamesLabPaciente?cd_pessoa_fisica=${cdPessoaFisica}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
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

  const fetchExamProgression = async (cdPessoaFisica: string, nrSeqExame: number) => {
    setLoadingProgression(true);
    try {
      const response = await fetch(
        `http://localhost:3210/prontuario/exames/buscarProgressaoExame?cd_pessoa_fisica=${cdPessoaFisica}&nr_seq_exame=${nrSeqExame}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar progressão do exame");
      }

      const data = await response.json();
      setExamProgressionData(data);
    } catch (error) {
      console.error("Erro ao buscar progressão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a progressão do exame.",
        variant: "destructive",
      });
    } finally {
      setLoadingProgression(false);
    }
  };

  const handleProgressExamChange = (value: string) => {
    setSelectedProgressExam(value);
    setExamProgressionData([]);
    
    if (selectedPatient?.cdPessoaFisica && value) {
      fetchExamProgression(selectedPatient.cdPessoaFisica, Number(value));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          {/* Tabela de Pacientes para Progressão Laboratorial */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl truncate">Progressão Laboratorial por Paciente</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/exam-results")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm shrink-0"
                size="sm"
              >
                ← Voltar
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {patients.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto max-h-[40vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
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

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3 max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-420px)] md:max-h-[40vh] overflow-y-auto">
                    {patients.map((patient, index) => (
                      <div
                        key={`${patient.id}-${index}`}
                        className="rounded-lg border bg-card p-4 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{patient.nome}</p>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${
                              patient.tipo === "Titular" 
                                ? "bg-primary/10 text-primary" 
                                : "bg-secondary/10 text-secondary-foreground"
                            }`}>
                              {patient.tipo}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleViewProgress(patient)}
                          className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Ver Progressão
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl truncate">Laudo de Exames Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {loading ? (
                <>
                  {/* Desktop skeleton */}
                  <div className="hidden md:block overflow-x-auto max-h-[50vh] overflow-y-auto">
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
                  
                  {/* Mobile skeleton */}
                  <div className="md:hidden space-y-3">
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
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum exame encontrado.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
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

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-340px)] md:max-h-[50vh] overflow-y-auto">
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
                          <p className="text-sm text-primary">{exam.medicoSolicitante}</p>
                        </div>
                        <Button
                          onClick={() => handleViewDetails(exam)}
                          className="w-full min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white"
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
                  <div className="mt-6">
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
            </CardContent>
          </Card>
        </div>
      </main>

      <ExamDetailsDialog
        open={dialogOpen && !!selectedExam}
        onOpenChange={setDialogOpen}
        idCliente={selectedExam?.idCliente || ""}
        idAtendimento={selectedExam?.nrAtendimento || 0}
        apiEndpoint="https://api-portalpaciente-web.samel.com.br/api/Agenda/Procedimento/ObterExamesLaudoLabDetalhe"
      />

      {/* Dialog de Progressão Laboratorial */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto">
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
                onValueChange={handleProgressExamChange}
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

            {loadingProgression && (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            )}

            {!loadingProgression && examProgressionData.length > 0 && (
              <div className="space-y-6">
                {/* Informações do último resultado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Último Resultado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-sm font-semibold">
                          {examProgressionData[0]?.DT_RESULTADO}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Resultado</p>
                        <p className="text-sm font-semibold">
                          {examProgressionData[0]?.DS_RESULTADO} {examProgressionData[0]?.DS_UNIDADE_MEDIDA}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Mínimo</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {examProgressionData[0]?.QT_MINIMA}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="text-sm font-semibold text-red-600">
                          {examProgressionData[0]?.QT_MAXIMA}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de progressão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progressão ao Longo do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={[...examProgressionData].reverse().map(item => ({
                          data: item.DT_RESULTADO,
                          resultado: item.DS_RESULTADO,
                          minimo: item.QT_MINIMA,
                          maximo: item.QT_MAXIMA,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={examProgressionData[0]?.QT_MINIMA} stroke="blue" strokeDasharray="3 3" label="Mínimo" />
                        <ReferenceLine y={examProgressionData[0]?.QT_MAXIMA} stroke="red" strokeDasharray="3 3" label="Máximo" />
                        <Line type="monotone" dataKey="resultado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabela com histórico completo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico Completo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Mínimo</TableHead>
                            <TableHead>Máximo</TableHead>
                            <TableHead>Referência</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examProgressionData.map((item, index) => (
                            <TableRow key={`${item.NR_ATENDIMENTO}-${index}`}>
                              <TableCell className="font-medium">{item.DT_RESULTADO}</TableCell>
                              <TableCell className="font-semibold">{item.DS_RESULTADO}</TableCell>
                              <TableCell>{item.DS_UNIDADE_MEDIDA}</TableCell>
                              <TableCell className="text-blue-600">{item.QT_MINIMA}</TableCell>
                              <TableCell className="text-red-600">{item.QT_MAXIMA}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.DS_REFERENCIA}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabExams;
