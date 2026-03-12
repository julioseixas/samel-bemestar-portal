

## Problema

O `GroupedExamRequestView` concatena **todos** os exames selecionados em um único template (um cabeçalho + um bloco de conteúdo com todos os `retornoDadosMobile` juntos via `<br/><br/>`). Como mostra a imagem, exames de datas diferentes (29/12/2025 e 26/12/2025) aparecem misturados no mesmo documento.

## Solução

Modificar o `GroupedExamRequestView` para **agrupar os exames por `dataEntrada`** e renderizar **um template completo (cabeçalho + dados do paciente + corpo) por grupo de data**, separados visualmente.

### Arquivo: `src/components/GroupedExamRequestView.tsx`

1. **Agrupar exames por `dataEntrada`** — criar um `Map<string, ExamData[]>` agrupando pelo campo `dataEntrada`
2. **Renderizar um template completo por grupo** — cada grupo de data recebe seu próprio cabeçalho (logo, dados Samel), dados do paciente/convênio (usando o primeiro exame do grupo), e corpo com o conteúdo concatenado apenas dos exames daquele grupo
3. **Separação visual entre grupos** — usar o mesmo padrão de card com borda/sombra (`rounded-lg border-2 shadow-md`) e separador com texto ("Pedido X de Y") entre os templates, similar ao que foi feito para os laudos no `ExamDetailsDialog`

A mudança é isolada neste componente — o `LabExamRequests.tsx` continua passando `exams={selectedRequests}` sem alteração.

