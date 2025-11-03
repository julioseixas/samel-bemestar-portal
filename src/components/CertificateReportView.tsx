import { Card } from "@/components/ui/card";
import samelLogo from "@/assets/samel-logo.png";

interface CertificateReportViewProps {
  certificateData: {
    nrAtendimento: number;
    dsResultado: string;
    nomeCliente: string;
    dataNascimento: string;
    dsConvenio: string;
    dsSetor: string;
    nomeProfissional: string;
    dataEntrada: string;
    dsAssinatura: string;
    qrCodeDownloadReceita?: string;
  };
  documentType?: "receita" | "atestado";
}

export function CertificateReportView({ certificateData, documentType = "atestado" }: CertificateReportViewProps) {
  console.log("🔍 CertificateReportView - certificateData:", certificateData);
  console.log("🔍 QR Code value:", certificateData.qrCodeDownloadReceita);
  console.log("🔍 QR Code exists?", !!certificateData.qrCodeDownloadReceita);
  
  return (
    <div id="printMe" className="bg-background p-6 max-w-[800px] mx-auto print:p-0">
      {/* CABEÇALHO */}
      <div className="flex mb-4 border border-border">
        <div className="w-[150px] border-r border-border flex items-center justify-center p-4 bg-card">
          <img src={samelLogo} alt="Samel Logo" className="w-full h-auto max-h-[100px] object-contain" />
        </div>
        <div className="flex-1 p-4 bg-card border-r border-border">
          <h5 className="text-center font-bold text-sm mb-2">
            SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA
          </h5>
          <p className="text-center text-xs text-muted-foreground mb-1">
            Rua Joaquim Nabuco, 1755 - Manaus - AM - CEP 69020030 - Fone: 21292200
          </p>
          <p className="text-center text-xs text-muted-foreground">
            CRF-RS 5-11649 CNPJ: 04159778000107
          </p>
        </div>
        {certificateData.qrCodeDownloadReceita && (
          <div className="w-[120px] flex items-center justify-center p-2 bg-card">
            <img 
              src={certificateData.qrCodeDownloadReceita} 
              alt="QR Code para Download" 
              className="w-full h-auto max-w-[100px] object-contain"
            />
          </div>
        )}
      </div>

      {/* RECEITA OU ATESTADO / ATENDIMENTO */}
      <div className="flex mb-4">
        <div className="flex-1 border border-border bg-card p-3">
          <p className="text-center font-bold">{documentType === "receita" ? "RECEITA" : "ATESTADO"}</p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card p-3">
          <p className="text-center">
            <span className="font-bold">ATENDIMENTO: </span>
            <span className="font-bold">{certificateData.nrAtendimento}</span>
          </p>
        </div>
      </div>

      {/* CORPO DO ATESTADO */}
      <div className="border border-border bg-card p-6 mb-4 min-h-[300px]">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: certificateData.dsResultado || "",
          }}
        />
      </div>

      {/* RODAPÉ - PACIENTE E CONVÊNIO */}
      <div className="flex mb-4">
        <div className="flex-1 border border-border bg-card px-4 py-2">
          <p className="mb-1">
            <span className="font-bold">Paciente: </span>
            {certificateData.nomeCliente}
          </p>
          <p>
            <span className="font-bold">Data Nasc: </span>
            {certificateData.dataNascimento}
          </p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card px-4 py-2">
          <p className="mb-1">
            <span className="font-bold">Convênio: </span>
            {certificateData.dsConvenio}
          </p>
          <p>
            <span className="font-bold">Setor: </span>
            {certificateData.dsSetor}
          </p>
        </div>
      </div>

      {/* RODAPÉ - MÉDICO E ASSINATURA */}
      <div className="flex mb-4">
        <div className="flex-[2] border border-border bg-card px-4 py-2">
          <p className="text-center mb-1">
            <span className="font-bold">Médico(a): </span>
            {certificateData.nomeProfissional}
          </p>
          <p className="text-center">
            <span className="font-bold">Data de Entrada: </span>
            {certificateData.dataEntrada}
          </p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card px-4 py-2">
          <p className="font-bold mb-1">Assinatura:</p>
          <div
            className="text-center flex items-center justify-center min-h-[80px]"
            dangerouslySetInnerHTML={{
              __html: certificateData.dsAssinatura || "",
            }}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-xs text-muted-foreground border-t border-border pt-2">
        <p>Este documento é válido somente com assinatura digital ou física do profissional responsável</p>
      </div>
    </div>
  );
}
