import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";

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
  dsAssinatura: string;
  medicoSolicitante: string;
  medicoLaudo: string;
  cd_medico_solic: string;
  nm_medico_solic: string;
  procedimentoExame: string;
  dtLaudo: string;
  dtLiberacao: string;
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
  const { toast } = useToast();

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
        headers: {
          "Content-Type": "application/json",
          "chave-autenticacao": authToken,
          "identificador-dispositivo": "request-android",
        },
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
      console.error("Erro ao buscar detalhes:", error);
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
    if (!selectedExam) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laudo - ${selectedExam.procedimentoExame}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              color: #059669;
              border-bottom: 2px solid #059669;
              padding-bottom: 10px;
            }
            .info {
              margin: 20px 0;
            }
            .info-row {
              margin: 10px 0;
            }
            .label {
              font-weight: bold;
              display: inline-block;
              width: 200px;
            }
            .content {
              margin-top: 20px;
              border: 1px solid #ddd;
              padding: 20px;
              background: #f9f9f9;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${selectedExam.procedimentoExame}</h1>
          <div class="info">
            <div class="info-row">
              <span class="label">Paciente:</span>
              <span>${selectedExam.nomeCliente}</span>
            </div>
            <div class="info-row">
              <span class="label">Data de Nascimento:</span>
              <span>${selectedExam.dataNascimento}</span>
            </div>
            <div class="info-row">
              <span class="label">Médico Solicitante:</span>
              <span>${selectedExam.medicoSolicitante}</span>
            </div>
            <div class="info-row">
              <span class="label">Médico do Laudo:</span>
              <span>${selectedExam.medicoLaudo}</span>
            </div>
            <div class="info-row">
              <span class="label">Data de Liberação:</span>
              <span>${selectedExam.dtLiberacao}</span>
            </div>
            <div class="info-row">
              <span class="label">Convênio:</span>
              <span>${selectedExam.dsConvenio}</span>
            </div>
            <div class="info-row">
              <span class="label">Setor:</span>
              <span>${selectedExam.dsSetor}</span>
            </div>
          </div>
          <div class="content">
            ${selectedExam.dsCabecalho || ""}
            ${selectedExam.dsAssinatura || ""}
          </div>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Imprimir
          </button>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <>
      <Dialog
        open={open && !selectedExam}
        onOpenChange={(isOpen) => {
          onOpenChange(isOpen);
          if (isOpen) {
            fetchExamDetails();
          } else {
            setExamDetails([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes dos Exames</DialogTitle>
            <DialogDescription>
              Visualize os detalhes completos dos exames realizados
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : examDetails.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum detalhe encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exame</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Data de Liberação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examDetails.map((detail, index) => (
                    <TableRow key={`${detail.nrSequenciaLaudoPaciente}-${index}`}>
                      <TableCell className="font-medium">
                        {detail.procedimentoExame}
                      </TableCell>
                      <TableCell>{detail.nomeCliente}</TableCell>
                      <TableCell>{detail.nomeProfissional}</TableCell>
                      <TableCell>{detail.dtLiberacao}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReport(detail)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Laudo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laudo - {selectedExam?.procedimentoExame}</DialogTitle>
            <DialogDescription>
              Laudo completo do exame com informações do paciente e resultado
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Paciente:</span>{" "}
                  {selectedExam.nomeCliente}
                </div>
                <div>
                  <span className="font-semibold">Data de Nascimento:</span>{" "}
                  {selectedExam.dataNascimento}
                </div>
                <div>
                  <span className="font-semibold">Médico Solicitante:</span>{" "}
                  {selectedExam.medicoSolicitante}
                </div>
                <div>
                  <span className="font-semibold">Médico do Laudo:</span>{" "}
                  {selectedExam.medicoLaudo}
                </div>
                <div>
                  <span className="font-semibold">Data de Liberação:</span>{" "}
                  {selectedExam.dtLiberacao}
                </div>
                <div>
                  <span className="font-semibold">Convênio:</span>{" "}
                  {selectedExam.dsConvenio}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedExam.dsCabecalho || "",
                  }}
                />
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedExam.dsAssinatura || "",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedExam(null)}>
                  Fechar
                </Button>
                <Button onClick={handlePrintReport}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Laudo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
