import { useState, useEffect } from "react";
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
import { ExamReportView } from "@/components/ExamReportView";

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

  // Chama a API quando o dialog abrir
  useEffect(() => {
    if (open && !selectedExam) {
      console.log("🔄 Dialog abriu, disparando fetchExamDetails...");
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
    if (!selectedExam) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get the HTML content from ExamReportView
    const printContent = document.getElementById("printMe");
    if (!printContent) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laudo - ${selectedExam.procedimentoExame}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
              background: white;
              line-height: 1.4;
            }
            
            /* Container principal */
            #printMe {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 0;
            }
            
            /* Remove backgrounds e bordas coloridas para impressão */
            div[style*="border"] {
              border-color: #000 !important;
            }
            
            /* Estilização dos textos */
            p {
              margin: 4px 0;
              color: #000;
            }
            
            strong {
              font-weight: bold;
              color: #000;
            }
            
            h5 {
              margin: 0;
              color: #000;
            }
            
            small {
              font-size: 11px;
              color: #000;
            }
            
            /* Cabeçalho */
            .text-primary {
              color: #000 !important;
            }
            
            /* Corpo do laudo */
            .prose {
              max-width: 100%;
              color: #000;
            }
            
            .prose p {
              margin: 8px 0;
              color: #000;
            }
            
            .prose pre {
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #000;
            }
            
            /* Remove cores de fundo */
            .bg-card,
            .bg-background {
              background: white !important;
            }
            
            /* Botões ocultos na impressão */
            button {
              display: none !important;
            }
            
            @media print {
              body {
                padding: 10mm;
              }
              
              @page {
                margin: 10mm;
                size: A4;
              }
              
              /* Evita quebras de página indesejadas */
              div {
                page-break-inside: avoid;
              }
              
              /* Remove shadows e efeitos */
              * {
                box-shadow: none !important;
                text-shadow: none !important;
              }
            }
            
            @media screen {
              .print-button {
                display: block !important;
                margin: 20px auto;
                padding: 12px 24px;
                background: #059669;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
              }
              
              .print-button:hover {
                background: #047857;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div style="margin-top: 30px; text-align: center; page-break-inside: avoid;">
            <button onclick="window.print()" class="print-button">
              Imprimir Laudo
            </button>
          </div>
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
          if (!isOpen) {
            onOpenChange(false);
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
            <div className="space-y-6">
              <ExamReportView
                examData={{
                  ...selectedExam,
                  dsResultado: selectedExam.dsResultado || selectedExam.dsCabecalho
                }}
                tipoLaudo={apiEndpoint.includes("Lab") ? "lab" : "cdi"}
              />

              <div className="flex justify-end gap-2 print:hidden">
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
