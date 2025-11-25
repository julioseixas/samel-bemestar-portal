import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiHeaders } from "@/lib/api-headers";
import { toast } from "sonner";
import { Calendar, User, Stethoscope, Clock, AlertCircle, Camera, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

const OnlineConsultationDetails = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [queueData, setQueueData] = useState<any>(null);
  const [appointmentQueueData, setAppointmentQueueData] = useState<any>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatientOnlineConsultation");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        setPatientName(storedTitular);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (storedSelectedPatient) {
      fetchAppointments(storedSelectedPatient);
    } else {
      toast.error("Nenhum paciente selecionado");
      navigate("/online-consultation-schedule");
    }
  }, [navigate]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const fetchAppointments = async (patientDataString: string) => {
    try {
      const patientData = JSON.parse(patientDataString);
      const headers = getApiHeaders();

      const response = await fetch(
        "https://appv2-back.samel.com.br/api/Agenda/ListarAgendamentosTele",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            idCliente: String(patientData.id)
          })
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        setAppointments(data.dados || []);
      } else {
        toast.error(data.mensagem || "Erro ao carregar agendamentos");
      }
    } catch (error) {
      toast.error("Erro ao carregar agendamentos de telemedicina");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
      
      await validateFacialRecognition(base64Image);
    }
  };

  const validateFacialRecognition = async (photoBase64: string) => {
    try {
      const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
      if (!storedPatient) {
        toast.error("Dados do paciente não encontrados");
        return;
      }

      const patientData = JSON.parse(storedPatient);
      const headers = getApiHeaders();

      const payload = {
        cpf: patientData.cpf || "",
        foto: photoBase64,
        cpfDependente: patientData.cpfDependente || ""
      };

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Cliente/ValidarRecFacial",
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        toast.success("Reconhecimento facial validado com sucesso!");
        handleCloseCamera();
        
        // Recarregar agendamentos para atualizar o status
        const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
        if (storedPatient) {
          fetchAppointments(storedPatient);
        }
      } else {
        toast.error(data.mensagem || "Erro na validação facial");
      }
    } catch (error) {
      toast.error("Erro ao validar reconhecimento facial");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCamera = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
    setSelectedAppointment(null);
  };

  const handleEmailCheckin = async (appointment: any) => {
    try {
      const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
      const storedUserData = localStorage.getItem("patientData");
      
      if (!storedPatient) {
        toast.error("Dados do paciente não encontrados");
        return;
      }

      const patientData = JSON.parse(storedPatient);

      // Buscar o email SEMPRE do titular
      const storedTitular = localStorage.getItem("titular");
      let email = "";

      if (storedTitular) {
        const titular = JSON.parse(storedTitular);
        email = titular.email || "";
      }

      if (!email) {
        toast.error("Email do paciente não encontrado");
        return;
      }

      const headers = getApiHeaders();
      
      const payload = {
        idMedico: String(appointment.idProfissional || ""),
        idCliente: String(patientData.id || ""),
        email: email,
        idAgendamento: appointment.id || 0,
        idDependente: patientData.tipo === "Dependente" ? String(patientData.id) : ""
      };

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/CadastrarTokenTelemedicina",
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        // Se código 2, mostrar alerta mas continuar o fluxo
        if (data.codigo === 2) {
          toast(data.mensagem || "Token já enviado anteriormente");
        }
        
        setPatientEmail(email);
        setSelectedAppointment(appointment);
        setShowTokenModal(true);
      } else {
        toast.error(data.mensagem || "Erro ao enviar código por email");
      }
    } catch (error) {
      toast.error("Erro ao processar check-in via email");
    }
  };

  const handleCloseTokenModal = () => {
    setShowTokenModal(false);
    setTokenInput("");
    setSelectedAppointment(null);
    setQueueData(null);
  };

  const handleViewQueue = async (appointment: any) => {
    setLoadingQueue(true);
    try {
      const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
      if (!storedPatient) {
        toast.error("Dados do paciente não encontrados");
        return;
      }

      const patientData = JSON.parse(storedPatient);
      const headers = getApiHeaders();

      const queuePayload = {
        idAgenda: appointment.idAgenda,
        idCliente: String(patientData.id)
      };

      const queueResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaTele",
        {
          method: "POST",
          headers,
          body: JSON.stringify(queuePayload)
        }
      );

      const queueResponseData = await queueResponse.json();

      if (queueResponseData.sucesso && queueResponseData.dados && queueResponseData.dados.length > 0) {
        setAppointmentQueueData(queueResponseData.dados[0]);
      } else {
        toast.error(queueResponseData.mensagem || "Erro ao obter informações da fila");
      }
    } catch (error) {
      toast.error("Erro ao carregar fila de atendimento");
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleValidateToken = async () => {
    if (!selectedAppointment || !tokenInput) return;

    setIsValidatingToken(true);
    try {
      const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
      if (!storedPatient) {
        toast.error("Dados do paciente não encontrados");
        return;
      }

      const patientData = JSON.parse(storedPatient);
      const headers = getApiHeaders();

      // 1. Validar o token
      const validatePayload = {
        idCliente: String(patientData.id),
        nrToken: tokenInput,
        idAgendamento: selectedAppointment.id,
        idDependente: String(patientData.id)
      };

      const validateResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ValidarTokenTelemedicina",
        {
          method: "POST",
          headers,
          body: JSON.stringify(validatePayload)
        }
      );

      const validateData = await validateResponse.json();

      if (!validateData.sucesso) {
        toast.error(validateData.mensagem || "Erro ao validar token");
        return;
      }

      // 2. Confirmar abertura do atendimento
      const confirmPayload = {
        idAgendamento: selectedAppointment.id
      };

      await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Atendimento/ConfirmarAberturaAtendimentoConsulta",
        {
          method: "POST",
          headers,
          body: JSON.stringify(confirmPayload)
        }
      );

      // 3. Listar fila
      const queuePayload = {
        idAgenda: selectedAppointment.idAgenda,
        idCliente: String(patientData.id)
      };

      const queueResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaTele",
        {
          method: "POST",
          headers,
          body: JSON.stringify(queuePayload)
        }
      );

      const queueResponseData = await queueResponse.json();

      if (queueResponseData.sucesso && queueResponseData.dados && queueResponseData.dados.length > 0) {
        setQueueData(queueResponseData.dados[0]);
        toast.success("Check-in realizado com sucesso!");
        
        // Recarregar agendamentos para atualizar o status
        const storedPatient = localStorage.getItem("selectedPatientOnlineConsultation");
        if (storedPatient) {
          fetchAppointments(storedPatient);
        }
      } else {
        toast.error(queueResponseData.mensagem || "Erro ao obter informações da fila");
      }

    } catch (error) {
      toast.error("Erro ao processar validação do token");
    } finally {
      setIsValidatingToken(false);
    }
  };

  useEffect(() => {
    if (showCamera && isCameraActive === false) {
      startCamera();
    }
  }, [showCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Consultas Online Agendadas
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/online-consultation-schedule")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize suas consultas de telemedicina agendadas
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhuma consulta online encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appointment, index) => {
                const hasCheckedIn = appointment.possuiAtendimento === "S";
                
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Consulta Online
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Paciente</p>
                            <p className="font-medium">{appointment.nomeCliente || "Não informado"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Profissional</p>
                            <p className="font-medium">{appointment.nomeProfissional || "Não informado"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Especialidade</p>
                            <p className="font-medium">{appointment.descricaoEspecialidade || "Não informada"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horário</p>
                            <p className="font-medium">{formatDateTime(appointment.dataAgenda)}</p>
                          </div>
                        </div>

                        {hasCheckedIn ? (
                          <>
                            <Alert className="mt-4 border-primary bg-primary/10">
                              <AlertCircle className="h-4 w-4 text-primary" />
                              <AlertDescription className="text-sm">
                                <strong>Atenção:</strong> Você já realizou o check-in para esta consulta
                              </AlertDescription>
                            </Alert>
                            
                            <Button
                              onClick={() => handleViewQueue(appointment)}
                              className="w-full mt-2"
                              variant="default"
                            >
                              Ver Fila de Atendimento
                            </Button>

                            {appointmentQueueData && loadingQueue === false && (
                              <Card className="mt-4 bg-muted/50">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">Fila de Atendimento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Horário da Consulta</p>
                                      <p className="font-medium text-sm">{appointmentQueueData.horario || "Não informado"}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Horário do Check-in</p>
                                      <p className="font-medium text-sm">{appointmentQueueData.horaChegada || "Não informado"}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Status</p>
                                      <p className="font-medium text-sm">{appointmentQueueData.statusDescricao || "Não informado"}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {loadingQueue && (
                              <div className="mt-4 text-center text-sm text-muted-foreground">
                                Carregando informações da fila...
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Alert className="mt-4 border-warning bg-warning/10">
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <AlertDescription className="text-sm">
                                <strong>Tempo limite de tolerância:</strong> 15 minutos para realizar o check-in
                              </AlertDescription>
                            </Alert>

                            <div className="flex gap-2 mt-4">
                              <Button 
                                onClick={() => handleOpenCamera(appointment)}
                                className="flex-1"
                                size="sm"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Check-in via Câmera
                              </Button>
                              <Button 
                                onClick={() => handleEmailCheckin(appointment)}
                                variant="outline"
                                className="flex-1"
                                size="sm"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Check-in via Email
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showCamera} onOpenChange={handleCloseCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in via Reconhecimento Facial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                disabled={!isCameraActive || isProcessing}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isProcessing ? "Processando..." : "Capturar Foto"}
              </Button>
              <Button
                onClick={handleCloseCamera}
                variant="outline"
                disabled={isProcessing}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTokenModal} onOpenChange={handleCloseTokenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!queueData ? (
              <>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    O código foi enviado para o email <strong>{patientEmail}</strong>. 
                    Verifique sua caixa de entrada e insira o código abaixo.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium">
                    Código de Validação
                  </label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Digite o código"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleValidateToken}
                    disabled={!tokenInput || isValidatingToken}
                    className="flex-1"
                  >
                    {isValidatingToken ? "Validando..." : "Confirmar"}
                  </Button>
                  <Button
                    onClick={handleCloseTokenModal}
                    variant="outline"
                    disabled={isValidatingToken}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert className="border-success bg-success/10">
                  <AlertCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-sm">
                    Check-in realizado com sucesso!
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horário da Consulta</p>
                      <p className="font-medium">{queueData.horario || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horário do Check-in</p>
                      <p className="font-medium">{queueData.horaChegada || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">{queueData.statusDescricao || "Não informado"}</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCloseTokenModal} className="w-full">
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineConsultationDetails;
