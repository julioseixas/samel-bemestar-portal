import samelLogo from "@/assets/samel-logo.png";
import QRCode from "react-qr-code";

interface ExamRequestViewProps {
  examData: {
    nrAtendimento: number;
    nomeCliente: string;
    dataNascimento: string;
    dsConvenio: string;
    dsSetor: string;
    nomeProfissional: string;
    dataEntrada: string;
    retornoDadosMobile: string;
    idCliente: string;
  };
}

export function ExamRequestView({ examData }: ExamRequestViewProps) {
  return (
    <div id="printMe" className="bg-background p-6 max-w-[800px] mx-auto print:p-0">
      {/* CABEÇALHO */}
      <div className="flex mb-4 border border-border">
        <div className="w-[80px] sm:w-[150px] border-r border-border flex items-center justify-center p-2 sm:p-4 bg-card">
          <img src={samelLogo} alt="Samel Logo" className="w-full h-auto max-h-[50px] sm:max-h-[100px] object-contain" />
        </div>
        <div className="flex-1 p-2 sm:p-4 bg-card border-r border-border">
          <h5 className="text-center font-bold text-[10px] sm:text-sm mb-1 sm:mb-2">
            SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA
          </h5>
          <p className="text-center text-[8px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
            Rua Joaquim Nabuco, 1755 - Manaus - AM - CEP 69020030 - Fone: 21292200
          </p>
          <p className="text-center text-[8px] sm:text-xs text-muted-foreground">
            CRF-RS 5-11649 CNPJ: 04159778000107 INSCRI. MUN-:
          </p>
        </div>
        <div className="w-[70px] sm:w-[120px] flex items-center justify-center p-1 sm:p-2 bg-card">
          <QRCode 
            value={examData.idCliente} 
            size={60}
            level="M"
            className="w-[60px] h-[60px] sm:w-[100px] sm:h-[100px]"
          />
        </div>
      </div>

      {/* SOLICITAÇÃO DE EXAMES / ATENDIMENTO */}
      <div className="flex mb-4">
        <div className="flex-1 border border-border bg-card p-3">
          <p className="text-center font-bold text-base">SOLICITAÇÃO DE EXAMES</p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card p-3">
          <p className="text-center text-base">
            <span className="font-bold">ATENDIMENTO: </span>
            <span className="font-bold">{examData.nrAtendimento}</span>
          </p>
        </div>
      </div>

      {/* INFORMAÇÕES DO PACIENTE E CONVÊNIO */}
      <div className="flex mb-4">
        <div className="flex-1 border border-border bg-card px-4 py-2">
          <p className="mb-1 text-sm">
            <span className="font-bold">Paciente: </span>
            {examData.nomeCliente}
          </p>
          <p className="mb-1 text-sm">
            <span className="font-bold">Data Nasc: </span>
            {examData.dataNascimento || "-"}
          </p>
          <p className="text-sm">
            <span className="font-bold">Convênio: </span>
            {examData.dsConvenio}
          </p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card px-4 py-2">
          <p className="mb-1 text-sm">
            <span className="font-bold">Setor: </span>
            {examData.dsSetor || "-"}
          </p>
          <p className="mb-1 text-sm">
            <span className="font-bold">Médico(a): </span>
            {examData.nomeProfissional}
          </p>
          <p className="text-sm">
            <span className="font-bold">Data de Entrada: </span>
            {examData.dataEntrada || "-"}
          </p>
        </div>
      </div>

      {/* CORPO DO PEDIDO - HTML DA API */}
      <div className="border border-border bg-card p-6 mb-4 min-h-[300px]">
        <div
          className="prose max-w-none text-sm"
          dangerouslySetInnerHTML={{
            __html: examData.retornoDadosMobile || "Nenhum detalhe disponível",
          }}
        />
      </div>
    </div>
  );
}
