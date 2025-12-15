import { useMemo } from "react";
import DOMPurify from "dompurify";
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

// Função para sanitizar HTML removendo larguras fixas
const sanitizeHtmlContent = (html: string): string => {
  if (!html) return "";

  // Hook para remover larguras fixas
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Remove atributo width de qualquer elemento
    if (node.hasAttribute && node.hasAttribute('width')) {
      node.removeAttribute('width');
    }
    // Remove atributo height de imagens para manter proporção
    if (node.tagName === 'IMG' && node.hasAttribute('height')) {
      node.removeAttribute('height');
    }
    // Remove larguras do style inline
    if (node.hasAttribute && node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const cleanStyle = style
        .replace(/width\s*:\s*[^;]+;?/gi, '')
        .replace(/min-width\s*:\s*[^;]+;?/gi, '')
        .replace(/max-width\s*:\s*[^;]+;?/gi, '');
      if (cleanStyle.trim()) {
        node.setAttribute('style', cleanStyle);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'meta', 'link'],
  });

  DOMPurify.removeHook('afterSanitizeAttributes');
  return clean;
};

export function ExamReportView({ examData, tipoLaudo }: ExamReportViewProps) {
  // Sanitiza o HTML do resultado e assinatura para remover larguras fixas
  const sanitizedResult = useMemo(() => sanitizeHtmlContent(examData.dsResultado), [examData.dsResultado]);
  const sanitizedSignature = useMemo(() => sanitizeHtmlContent(examData.dsAssinatura), [examData.dsAssinatura]);

  return (
    <div id="printMe" className="bg-background p-3 sm:p-6 w-full max-w-[800px] mx-auto print:p-0 overflow-x-hidden">
      {/* CABEÇALHO */}
      <div className="flex mb-3 sm:mb-4 border border-border">
        <div className="w-[60px] sm:w-[150px] border-r border-border flex items-center justify-center p-1.5 sm:p-4 bg-card">
          <img src={samelLogo} alt="Samel Logo" className="w-full h-auto max-h-[40px] sm:max-h-[100px] object-contain" />
        </div>
        <div className="flex-1 p-1.5 sm:p-4 bg-card">
          <h5 className="text-center font-bold text-[8px] sm:text-sm mb-0.5 sm:mb-2">
            SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA
          </h5>
          <p className="text-center text-[6px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
            Rua Joaquim Nabuco, 1755 - Manaus - AM - CEP 69020030 - Fone: 21292200
          </p>
          <p className="text-center text-[6px] sm:text-xs text-muted-foreground">
            CRF-RS 5-11649 CNPJ: 04159778000107
          </p>
        </div>
      </div>

      {/* EXAMES / ATENDIMENTO */}
      <div className="flex mb-3 sm:mb-4">
        <div className="flex-1 border border-border bg-card p-2 sm:p-3">
          <p className="text-center font-bold text-sm sm:text-base">EXAMES</p>
        </div>
        <div className="flex-1 border border-border border-l-0 bg-card p-2 sm:p-3">
          <p className="text-center text-xs sm:text-base">
            <span className="font-bold">ATEND: </span>
            <span className="font-bold">{examData.nrAtendimento}</span>
          </p>
        </div>
      </div>

      {/* MÉDICO SOLICITANTE */}
      <div className="mb-3 sm:mb-4">
        <div className="border border-border bg-card px-2 sm:px-4 py-1.5 sm:py-2">
          <p className="text-center text-xs sm:text-sm">
            <span className="font-bold">Médico(a) Solicitante: </span>
            <span className="break-words">{examData.medicoSolicitante}</span>
          </p>
        </div>
      </div>

      {/* CORPO DO LAUDO */}
      <div className="border border-border bg-card p-3 sm:p-6 mb-3 sm:mb-4 min-h-[200px] sm:min-h-[300px] overflow-x-hidden">
        <div
          className="max-w-none text-[10px] sm:text-sm [&_p]:text-[10px] [&_p]:sm:text-sm [&_td]:text-[10px] [&_td]:sm:text-sm [&_th]:text-[10px] [&_th]:sm:text-sm [&_span]:text-[10px] [&_span]:sm:text-sm [&_*]:break-words [&_*]:max-w-full [&_*]:overflow-wrap-anywhere [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words [&_img]:max-w-full [&_img]:h-auto [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-hidden overflow-x-hidden [&_*]:leading-tight sm:[&_*]:leading-normal"
          dangerouslySetInnerHTML={{
            __html: sanitizedResult,
          }}
        />
      </div>

      {/* RODAPÉ 1 - PACIENTE E CONVÊNIO */}
      <div className="flex flex-col sm:flex-row mb-3 sm:mb-4">
        <div className="flex-1 border border-border bg-card px-2 sm:px-4 py-1.5 sm:py-2">
          <p className="mb-0.5 sm:mb-1 text-xs sm:text-sm">
            <span className="font-bold">Paciente: </span>
            <span className="break-words">{examData.nomeCliente}</span>
          </p>
          <p className="text-xs sm:text-sm">
            <span className="font-bold">Data Nasc: </span>
            {examData.dataNascimento}
          </p>
        </div>
        <div className="flex-1 border border-border border-t-0 sm:border-t sm:border-l-0 bg-card px-2 sm:px-4 py-1.5 sm:py-2">
          <p className="mb-0.5 sm:mb-1 text-xs sm:text-sm">
            <span className="font-bold">Convênio: </span>
            <span className="break-words">{examData.dsConvenio}</span>
          </p>
          <p className="text-xs sm:text-sm">
            <span className="font-bold">Setor: </span>
            {examData.dsSetor}
          </p>
        </div>
      </div>

      {/* RODAPÉ 2 - MÉDICO E ASSINATURA */}
      <div className="flex flex-col sm:flex-row mb-3 sm:mb-4">
        <div className="flex-[2] border border-border bg-card px-2 sm:px-4 py-1.5 sm:py-2">
          <p className="text-center mb-0.5 sm:mb-1 text-xs sm:text-sm">
            <span className="font-bold">
              {tipoLaudo === "lab" ? "Analista Clínico: " : "Médico(a): "}
            </span>
            <span className="break-words">{examData.medicoLaudo}</span>
          </p>
          <p className="text-center text-xs sm:text-sm">
            <span className="font-bold">Data de Entrada: </span>
            {examData.dataEntrada}
          </p>
        </div>
        <div className="flex-1 border border-border border-t-0 sm:border-t sm:border-l-0 bg-card px-2 sm:px-4 py-1.5 sm:py-2">
          <p className="font-bold mb-0.5 sm:mb-1 text-xs sm:text-sm">Assinatura:</p>
          <div
            className="text-center min-h-[60px] sm:min-h-[80px] flex items-center justify-center text-xs sm:text-sm [&_img]:max-w-full [&_img]:h-auto"
            dangerouslySetInnerHTML={{
              __html: sanitizedSignature,
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
