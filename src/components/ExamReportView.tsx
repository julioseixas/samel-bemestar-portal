import { Card } from "@/components/ui/card";
import samelLogo from "@/assets/samel-logo.png";

interface ExamReportViewProps {
  examData: {
    procedimentoExame: string;
    nrAtendimento: number;
    medicoSolicitante: string;
    dsResultado: string;
    dsAssinatura: string;
    nomeCliente: string;
    dataNascimento: string;
    dsConvenio: string;
    dsSetor: string;
    medicoLaudo: string;
    dataEntrada: string;
  };
  tipoLaudo: "lab" | "cdi";
}

export function ExamReportView({ examData, tipoLaudo }: ExamReportViewProps) {
  return (
    <div id="printMe" className="bg-background p-3 sm:p-6 max-w-[800px] mx-auto print:p-0">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row mb-4 border border-border">
        <div className="w-full sm:w-[150px] border-b sm:border-b-0 sm:border-r border-border flex items-center justify-center p-3 sm:p-4 bg-card">
          <img src={samelLogo} alt="Samel Logo" className="w-24 sm:w-full h-auto max-h-[80px] sm:max-h-[100px] object-contain" />
        </div>
        <div className="flex-1 p-3 sm:p-4 bg-card">
          <h5 className="text-center font-bold text-xs sm:text-sm mb-1 sm:mb-2">
            SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA
          </h5>
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
            Rua Joaquim Nabuco, 1755 - Manaus - AM - CEP 69020030 - Fone: 21292200
          </p>
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
            CRF-RS 5-11649 CNPJ: 04159778000107
          </p>
        </div>
      </div>

      {/* EXAMES / ATENDIMENTO */}
      <div className="flex flex-col sm:flex-row mb-4">
        <div className="flex-1 border border-border bg-card p-2 sm:p-3">
          <p className="text-center font-bold text-xs sm:text-base">EXAMES</p>
        </div>
        <div className="flex-1 border border-border border-t-0 sm:border-t sm:border-l-0 bg-card p-2 sm:p-3">
          <p className="text-center text-xs sm:text-base">
            <span className="font-bold">ATENDIMENTO: </span>
            <span className="font-bold">{examData.nrAtendimento}</span>
          </p>
        </div>
      </div>

      {/* MÉDICO SOLICITANTE */}
      <div className="mb-4">
        <div className="border border-border bg-card px-3 sm:px-4 py-2">
          <p className="text-center text-xs sm:text-sm">
            <span className="font-bold">Médico(a) Solicitante: </span>
            {examData.medicoSolicitante}
          </p>
        </div>
      </div>

      {/* CORPO DO LAUDO */}
      <div className="border border-border bg-card p-3 sm:p-6 mb-4 min-h-[200px] sm:min-h-[300px]">
        <div
          className="prose prose-sm sm:prose max-w-none text-xs sm:text-sm"
          dangerouslySetInnerHTML={{
            __html: examData.dsResultado || "",
          }}
        />
      </div>

      {/* RODAPÉ 1 - PACIENTE E CONVÊNIO */}
      <div className="flex flex-col sm:flex-row mb-4">
        <div className="flex-1 border border-border bg-card px-3 sm:px-4 py-2">
          <p className="mb-1 text-xs sm:text-sm">
            <span className="font-bold">Paciente: </span>
            {examData.nomeCliente}
          </p>
          <p className="text-xs sm:text-sm">
            <span className="font-bold">Data Nasc: </span>
            {examData.dataNascimento}
          </p>
        </div>
        <div className="flex-1 border border-border border-t-0 sm:border-t sm:border-l-0 bg-card px-3 sm:px-4 py-2">
          <p className="mb-1 text-xs sm:text-sm">
            <span className="font-bold">Convênio: </span>
            {examData.dsConvenio}
          </p>
          <p className="text-xs sm:text-sm">
            <span className="font-bold">Setor: </span>
            {examData.dsSetor}
          </p>
        </div>
      </div>

      {/* RODAPÉ 2 - MÉDICO E ASSINATURA */}
      <div className="flex flex-col sm:flex-row mb-4">
        <div className="flex-[2] border border-border bg-card px-3 sm:px-4 py-2">
          <p className="text-center mb-1 text-xs sm:text-sm">
            <span className="font-bold">
              {tipoLaudo === "lab" ? "Analista Clínico: " : "Médico(a): "}
            </span>
            {examData.medicoLaudo}
          </p>
          <p className="text-center text-xs sm:text-sm">
            <span className="font-bold">Data de Entrada: </span>
            {examData.dataEntrada}
          </p>
        </div>
        <div className="flex-1 border border-border border-t-0 sm:border-t sm:border-l-0 bg-card px-3 sm:px-4 py-2">
          <p className="font-bold mb-1 text-xs sm:text-sm">Assinatura:</p>
          <div
            className="text-center min-h-[60px] sm:min-h-[80px] flex items-center justify-center text-xs sm:text-sm"
            dangerouslySetInnerHTML={{
              __html: examData.dsAssinatura || "",
            }}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-[10px] sm:text-xs text-muted-foreground border-t border-border pt-2">
        <p>Este documento é válido somente com assinatura digital ou física do profissional responsável</p>
      </div>
    </div>
  );
}
