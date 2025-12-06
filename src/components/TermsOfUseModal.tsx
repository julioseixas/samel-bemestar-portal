import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsOfUseModal = ({ open, onOpenChange }: TermsOfUseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl h-[calc(100vh-1.5rem)] sm:h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b bg-card shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Termos de Uso</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-6">
            
            {/* Seção 1: Termos de Condições de Uso */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                TERMOS DE CONDIÇÕES DE USO DO PACIENTE – APLICATIVO SAMEL
              </h2>
              
              <p className="text-muted-foreground mb-4">
                O presente termo é firmado entre a SAMEL SERVIÇO DE ASSISTÊNCIA MÉDICA LTDA, pessoa jurídica de direito privado, 
                inscrita no CNPJ nº 04.159.778/0001-07 com sede nesta cidade na Avenida Joaquim Nabuco, Nº 1.755, Bairro Centro de Manaus, 
                Estado do Amazonas, detentora do APLICATIVO SAMEL, ora denominada CONTRATADA e o USUÁRIO DOS SERVIÇOS, ora denominado USUÁRIO.
              </p>
              
              <p className="text-muted-foreground mb-4">
                O USUÁRIO que pretenda utilizar os serviços da CONTRATADA deverá aceitar os termos e condições gerais e todas as políticas e os princípios que o regem.
              </p>
            </section>

            {/* Concordância com as Condições Gerais */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Concordância com as Condições Gerais</h3>
              
              <p className="text-muted-foreground mb-3">
                O uso do Aplicativo Samel, ainda que parcialmente ou a título deste, implica que o usuário está plenamente ciente e em concordância com todas as Condições Gerais apresentadas.
              </p>
              
              <p className="text-muted-foreground mb-3">
                O Aplicativo Samel só poderá ser utilizado após a leitura das Condições Gerais, e sua utilização significa a concordância integral dos termos estabelecidos. 
                Caso o paciente Samel não concorde com quaisquer umas condições, o mesmo não deverá utilizá-lo.
              </p>
              
              <p className="text-muted-foreground">
                Caso o paciente discorde das Condições Gerais após o início da utilização do Aplicativo Samel, o seu uso deverá ser suspenso de imediato.
              </p>
            </section>

            {/* Condições Gerais */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Condições Gerais</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">1. Funcionalidades Aplicativo Samel</h4>
                  <p className="text-muted-foreground mb-2">As principais funcionalidades do Aplicativo Samel são:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Agendamento de consultas e exames em data e hora disponíveis com um profissional de saúde dos Hospitais Samel;</li>
                    <li>Acompanhamento do período de internação do paciente em um dos Hospitais Samel (Hospital Matriz, Hospital Oscar Nicolau ou Hospital Samel Boulevard);</li>
                    <li>Observar os horários em que os medicamentos são administrados;</li>
                    <li>O nome dos medicamentos que estão sendo administrados no paciente;</li>
                    <li>O nome dos integrantes da equipe assistencial e de atendimento;</li>
                    <li>Avaliação do serviço e do atendimento prestado por cada equipe (Médica, Enfermagem, Atendimento, entre outras).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">2. Disponibilização do Aplicativo Samel</h4>
                  <p className="text-muted-foreground">
                    O Aplicativo Samel é disponibilizado gratuitamente aos usuários para download em dispositivos móveis que se utilizam dos sistemas Android e iOS.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">3. Procedimento de definição de Login e Senha</h4>
                  <p className="text-muted-foreground">
                    No Aplicativo Samel, estão presentes as credenciais de acesso e é de responsabilidade do usuário a guarda das informações de acesso, 
                    devendo tomar todas as precauções necessárias para impedir o acesso indevido dessas informações.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">4. Uso de dados do paciente</h4>
                  <p className="text-muted-foreground mb-2">
                    O usuário cede gratuitamente seus dados pessoais descritos no cadastro do Aplicativo Samel para o bom funcionamento do mesmo;
                  </p>
                  <p className="text-muted-foreground mb-2">
                    O registro do Aplicativo Samel somente é permitido aos usuários maiores de 18 (dezoito) anos.
                  </p>
                  <p className="text-muted-foreground">
                    A Samel garante que envidará todos os esforços de segurança disponíveis para a preservação das informações do usuário Samel.
                  </p>
                </div>
              </div>
            </section>

            {/* Uso de Dados Pessoais */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Uso de Dados Pessoais</h3>
              
              <p className="text-muted-foreground mb-3">
                A Samel coletará todos os dados pessoais inseridos por você, usuário, ao se cadastrar no Aplicativo Samel. Abaixo, seguem os dados a serem coletados:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-3 ml-2">
                <li>Nome, CPF, Telefone, RG e e-mail.</li>
              </ul>
              <p className="text-muted-foreground">
                No Aplicativo Samel, você, usuário, poderá agendar consultas médicas ambulatoriais e exames laboratoriais e de imagem, 
                além de poder avaliar na aba "Minha Internação" o atendimento recebido pelas equipes de atendimento da recepção, 
                equipe médica, de enfermagem, de hotelaria e higienização.
              </p>
            </section>

            {/* Utilização dos seus dados pessoais */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Utilização dos seus dados pessoais</h3>
              
              <p className="text-muted-foreground mb-3">
                A Samel coleta dos dados dos seus usuários para diversas finalidades, entre elas:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Execução de contratos ou diligências preliminares, tais como: administração, gestão, prestação, ampliação e melhoria dos serviços oferecidos;</li>
                <li>Para o relacionamento e oferecimento de informações referentes aos produtos e serviços contratados;</li>
                <li>Para avaliar se é possível o oferecimento de determinados produtos ou serviços e sob quais condições.</li>
              </ul>
            </section>

            {/* Compartilhamento dos seus dados pessoais */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Compartilhamento dos seus dados pessoais</h3>
              
              <p className="text-muted-foreground mb-3">
                Em algumas situações a Samel precisará compartilhar os seus dados pessoais com terceiros nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Empresas parceiras e fornecedores, no desenvolvimento e prestação de serviços disponibilizados a você;</li>
                <li>Entidades governamentais, autoridades ou outros terceiros para a proteção dos interesses do Grupo Samel em qualquer tipo de conflito, incluindo ações judiciais e processos administrativos;</li>
                <li>Mediante ordem judicial ou requerimento de autoridades administrativas que detenham competência legal para a sua requisição.</li>
              </ul>
            </section>

            {/* Como a Samel mantém seus dados seguros */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Como a Samel mantém seus dados seguros</h3>
              
              <p className="text-muted-foreground mb-3">
                Qualquer dado pessoal em posse do Grupo Samel será armazenado de acordo com os mais rígidos padrões de segurança, incluindo a adoção de medidas como:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Proteção contra acesso não autorizado a seus sistemas;</li>
                <li>Acesso restrito de pessoas específicas ao local onde são armazenadas as informações pessoais dos clientes;</li>
                <li>Garantia para que agentes, colaboradores ou parceiros externos que realizem o tratamento de dados pessoais deverão se comprometer a manter o sigilo absoluto das informações.</li>
              </ul>
            </section>

            {/* Por quanto tempo os seus dados ficarão armazenados */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Por quanto tempo os seus dados ficarão armazenados</h3>
              
              <p className="text-muted-foreground">
                Os dados pessoais tratados pela Samel serão excluídos quando deixarem de ser úteis para os fins para os quais foram coletados, 
                ou quando o usuário solicitar a sua exclusão, exceto na hipótese de necessidade de cumprimento de obrigação legal ou regulatória 
                a exemplo da Lei do Prontuário Eletrônico com o fulcro no artigo 6º da Lei 13.787/2018, que determina a guarda do respectivo documento por, 
                no mínimo, 20 (vinte) anos, a partir do último registro, transferência a terceiro – desde que respeitados os requisitos de tratamento de dados – 
                e uso exclusivo da Samel, inclusive para o exercício de seus direitos em processos judiciais ou administrativos.
              </p>
            </section>

            {/* Legislação Aplicável */}
            <section>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Legislação Aplicável</h3>
              
              <p className="text-muted-foreground mb-4">
                Este Termo de Uso e Política de Privacidade foi elaborado com base na Lei Federal nº 13.709/2018 – Lei Geral de Proteção de Dados "LGPD".
              </p>
              <p className="text-muted-foreground mb-4">
                O Grupo Samel reserva o direito, a seu exclusivo critério, de modificar, alterar, acrescentar ou remover partes deste documento a qualquer momento.
              </p>
              <p className="text-muted-foreground font-medium">
                SAMEL SERVIÇO DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA.<br/>
                CNPJ 04.159.778/0001-07
              </p>
            </section>

            <hr className="border-border my-6" />

            {/* Política de Privacidade - Seções numeradas */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">POLÍTICA DE PRIVACIDADE</h2>
              
              <div className="space-y-6">
                {/* 1. Introdução */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">1. INTRODUÇÃO</h3>
                  <p className="text-muted-foreground mb-3">
                    A Samel valoriza a privacidade de seus usuários e criou esta Política para demonstrar seu compromisso em proteger a sua privacidade e seus dados pessoais, 
                    nos termos da Lei Geral de Proteção de Dados (LGPD, Lei Federal 13.709/2018), bem como descrever de que forma sua privacidade é protegida ao coletar, tratar e armazenar suas informações pessoais.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Ao utilizar nossos serviços, você entende que coletaremos e usaremos suas informações pessoais nas formas descritas nesta Política, 
                    sob as normas de Proteção de Dados, das disposições consumeristas da Lei Federal 8078/1990 e as demais normas do ordenamento jurídico brasileiro aplicáveis.
                  </p>
                  <p className="text-muted-foreground font-semibold bg-primary/5 p-3 rounded-lg">
                    Dessa forma, a SAMEL SERVIÇOS DE ASSISTÊNCIA MÉDICO HOSPITALAR LTDA, inscrita no CNPJ sob o nº 04.159.778/0001-07 e SAMEL PLANO DE SAÚDE LTDA, 
                    inscrita no CNPJ 84.537.141/0001-38, doravante denominadas simplesmente como "Samel", no papel de Controladoras de Dados, obrigam-se ao disposto na presente Política de Privacidade.
                  </p>
                </div>

                {/* 2. Definições */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">2. DEFINIÇÕES</h3>
                  <dl className="space-y-3 text-muted-foreground">
                    <div>
                      <dt className="font-semibold text-foreground">Usuário:</dt>
                      <dd>Todas as pessoas físicas que utilizarão ou visitarão o(s) Site(s), Sistema(s) e/ou Aplicativo(s), maiores de 18 (dezoito) anos ou emancipadas e totalmente capazes de praticar os atos da vida civil ou os absolutamente ou relativamente incapazes devidamente representados ou assistidos.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Dados Pessoais:</dt>
                      <dd>Significa quaisquer informações fornecidas e/ou coletadas pela Samel e/ou suas afiliadas, por qualquer meio, ainda que públicos, que: (I) identifiquem, ou que, quando usadas em combinação com outras informações tratadas pela Samel identifiquem um indivíduo; ou (II) por meio das quais a identificação ou informações de contato de uma pessoa física possam ser derivadas.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Finalidade:</dt>
                      <dd>O objetivo e o propósito que a Samel deseja alcançar a partir de cada ato de tratamento das informações pessoais.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Necessidade:</dt>
                      <dd>Justificativa pelo qual é estritamente necessário coletar dados pessoais, para atingir a finalidade, evitando-se a coleta excessiva.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Bases Legais:</dt>
                      <dd>Fundamentação legal que torna legítimo o tratamento de dados pessoais para uma determinada finalidade prévia por parte da Samel.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Consentimento:</dt>
                      <dd>Autorização expressa e inequívoca dada pelo Usuário titular do dado pessoal para que a Samel trate seus dados pessoais para uma finalidade previamente descrita.</dd>
                    </div>
                  </dl>
                </div>

                {/* 3. Coleta e uso de informações pessoais */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">3. COLETA E USO DE INFORMAÇÕES PESSOAIS</h3>
                  <p className="text-muted-foreground mb-3">
                    O Usuário está ciente de que fornece informação de forma consciente e voluntária por meio de formulários físicos ou digitais e através de entradas de dados presentes nas soluções tecnológicas próprias, de terceiros, ou por meio de sites operados pela Samel.
                  </p>
                  <p className="text-muted-foreground">
                    Os Dados Pessoais solicitados serão mantidos em sigilo e serão utilizados apenas para o propósito que motivou o cadastro.
                  </p>
                </div>

                {/* 4. Direito de acessar e controlar seus dados pessoais */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">4. DIREITO DE ACESSAR E CONTROLAR SEUS DADOS PESSOAIS</h3>
                  <p className="text-muted-foreground mb-3">
                    A Samel assegura aos seus usuários e clientes os direitos de titular previstos no artigo 18 da Lei Geral de Proteção de Dados. Podendo, dessa forma, de maneira gratuita e a qualquer tempo:
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-2">
                    <li><strong className="text-foreground">Confirmar a existência de tratamento de dados,</strong> de maneira simplificada ou em formato claro e completo.</li>
                    <li><strong className="text-foreground">Acessar seus dados,</strong> podendo solicitá-los em uma cópia legível sob forma impressa ou por meio eletrônico, seguro e idôneo.</li>
                    <li><strong className="text-foreground">Corrigir seus dados,</strong> ao solicitar a edição, correção ou atualização destes.</li>
                    <li><strong className="text-foreground">Limitar e eliminar seus dados,</strong> quando desnecessários, excessivos ou tratados em desconformidade com a legislação através da anonimização, bloqueio ou eliminação.</li>
                    <li><strong className="text-foreground">Solicitar a portabilidade de seus dados,</strong> através de solicitação formal.</li>
                    <li><strong className="text-foreground">Revogar seu consentimento,</strong> desautorizando o tratamento de seus dados.</li>
                    <li><strong className="text-foreground">Informar-se sobre a possibilidade de não fornecer seu consentimento,</strong> e sobre as consequências da negativa. Porém, em alguns casos, a não autorização pode incorrer em uma administração e gestão ineficaz da prestação de serviços.</li>
                  </ul>
                </div>

                {/* 5. Direitos do Titular */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">5. DIREITOS DO TITULAR</h3>
                  <p className="text-muted-foreground mb-3">
                    Para exercer seus direitos de titular, você deverá entrar em contato com a Samel através do e-mail: <a href="mailto:dpo@samel.com.br" className="text-primary hover:underline">dpo@samel.com.br</a>
                  </p>
                  <p className="text-muted-foreground mb-3">
                    Os seguintes direitos podem se aplicar ao seu caso, dependendo da natureza da relação e atividade que requeiram o tratamento de dados pessoais, e da jurisdição onde será feito o tratamento:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Direito de acesso, confirmação e correção de seus dados pessoais</li>
                    <li>Portabilidade dos dados</li>
                    <li>Direito à correção ou exclusão dos dados pessoais</li>
                    <li>Direito à restrição do tratamento</li>
                    <li>Direito de cancelar seu consentimento</li>
                    <li>Direito de manifestar objeção ao tratamento</li>
                    <li>Direito à revisão do processo automático de tomada de decisões</li>
                    <li>Direito de objeção à forma como utilizamos seus dados pessoais para fins de marketing direto ou outra rotina</li>
                    <li>Direito de obter garantias de segurança dos dados pessoais que utilizamos para transferências e compartilhamento</li>
                    <li>Direito de reclamar junto ao nosso profissional encarregado pela proteção de dados ou autoridade reguladora</li>
                  </ul>
                </div>

                {/* 6. Tempo de Armazenamento de Dados */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">6. TEMPO DE ARMAZENAMENTO DE DADOS</h3>
                  <p className="text-muted-foreground mb-3">
                    Seus dados pessoais coletados serão utilizados e armazenados durante o tempo necessário para a prestação do serviço ou para que as finalidades elencadas na presente Política sejam atingidas, considerando os direitos dos titulares dos dados e dos controladores.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    De modo geral, seus dados serão mantidos enquanto a relação contratual entre você e a Samel perdurar. Findado o período de armazenamento dos dados pessoais, estes serão excluídos de nossas bases de dados ou anonimizados, ressalvadas as hipóteses legalmente previstas no artigo 16 da Lei Geral de Proteção de Dados, a saber:
                  </p>
                  <ol className="list-[upper-roman] list-inside text-muted-foreground space-y-2 ml-2">
                    <li>Cumprimento de obrigação legal ou regulatória pelo controlador;</li>
                    <li>Estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais;</li>
                    <li>Transferência a terceiro, desde que respeitados os requisitos de tratamento de dados dispostos nesta Lei;</li>
                    <li>Uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados.</li>
                  </ol>
                </div>

                {/* 7. Segurança de Informações Pessoais */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">7. SEGURANÇA DE INFORMAÇÕES PESSOAIS</h3>
                  <p className="text-muted-foreground mb-3">
                    Para mantermos suas informações pessoais seguras, usamos ferramentas físicas, eletrônicas e gerenciais orientadas para a proteção da sua privacidade, levando em consideração a natureza dos dados pessoais coletados, o contexto e a finalidade do tratamento e os riscos que eventuais violações gerariam para os direitos e liberdades do titular dos dados.
                  </p>
                  <p className="text-muted-foreground mb-3">Entre as medidas que adotamos, destacamos as seguintes:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mb-3">
                    <li>Apenas pessoas autorizadas têm acesso a seus dados pessoais;</li>
                    <li>O acesso aos seus dados pessoais é feito somente após o compromisso de confidencialidade;</li>
                    <li>Seus dados pessoais são armazenados em ambiente seguro e idôneo.</li>
                  </ul>
                  <p className="text-muted-foreground">
                    A Samel se compromete a adotar as melhores práticas a fim de evitar incidentes de segurança. Contudo, é necessário destacar que nenhum sistema corporativo, aplicativo (app) ou página virtual são inteiramente seguros. Em caso de incidentes de segurança que possam gerar riscos ou danos relevantes a quaisquer usuários, comunicaremos ao(s) afetado(s) e à Autoridade Nacional de Proteção de Dados sobre o ocorrido.
                  </p>
                </div>

                {/* 8. Compartilhamento e Tratamento de Informações Pessoais */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">8. COMPARTILHAMENTO E TRATAMENTO DE INFORMAÇÕES PESSOAIS</h3>
                  <p className="text-muted-foreground mb-3">
                    A Samel não disponibilizará Dados Pessoais coletados em seus sites para corretores de lista de e-mail sem seu expresso consentimento.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    A Samel poderá divulgar os Dados Pessoais coletados a terceiros, nas seguintes situações e nos limites exigidos e autorizados pela Lei:
                  </p>
                  <ol className="list-[upper-roman] list-inside text-muted-foreground space-y-2 ml-2">
                    <li>Com os seus clientes e parceiros quando necessário e/ou apropriado à prestação de serviços relacionados;</li>
                    <li>Com as empresas e indivíduos contratados para a execução de determinadas atividades e serviços em nome da Samel;</li>
                    <li>Com empresas do grupo;</li>
                    <li>Com fornecedores e parceiros para consecução dos serviços contratados com a Samel;</li>
                    <li>Para propósitos administrativos como: pesquisa, planejamento, desenvolvimento de serviços, segurança e gerenciamento de risco;</li>
                    <li>Quando necessário em decorrência de obrigação legal, determinação de autoridade competente, ou decisão judicial.</li>
                  </ol>
                </div>

                {/* 9. Responsabilidades como Colaborador */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">9. QUAIS AS MINHAS RESPONSABILIDADES COMO COLABORADOR SAMEL?</h3>
                  <p className="text-muted-foreground mb-3">Caso você seja um colaborador da SAMEL deve:</p>
                  <ol className="list-[lower-alpha] list-inside text-muted-foreground space-y-2 ml-2">
                    <li>Ler, conhecer e cumprir integralmente e sem exceções as definições previstas na Política de Privacidade e Proteção de Dados;</li>
                    <li>Manter suas informações pessoais atualizadas junto à empresa;</li>
                    <li>Contribuir com atitudes proativas e na disseminação da cultura SAMEL de privacidade e segurança de dados;</li>
                    <li>Observar as cláusulas do seu contrato de trabalho relacionados ao tratamento e proteção de dados;</li>
                    <li>Seguir as determinações dos termos aos quais você assumiu responsabilidades junto à SAMEL;</li>
                    <li>Compartilhar qualquer risco relacionado à proteção de dados com o encarregado de proteção de dados;</li>
                    <li>Comunicar ao encarregado de proteção de dados qualquer evento que possa infringir a política de privacidade e proteção de dados.</li>
                  </ol>
                </div>

                {/* 10. Responsabilidades como Titular de Dados */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">10. QUAIS AS MINHAS RESPONSABILIDADES COMO CANDIDATO, CLIENTE, BENEFICIÁRIO, CONVENIADO, DEPENDENTE, VISITANTE, FORNECEDOR OU OUTRO TITULAR DE DADOS?</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Candidato:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                        <li>Ler atentamente esta declaração de privacidade.</li>
                        <li>Se você é ou foi candidato em algum dos nossos processos seletivos e nos forneceu informações pessoais sobre outras pessoas, só usaremos essas informações para o motivo específico pelo qual nos foram fornecidas.</li>
                        <li>Autorizar eventual compartilhamento das empresas que auxiliam a SAMEL no processo de seleção e recrutamento.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Cliente, usuário, conveniado e fornecedor:</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                        <li>Ler atentamente esta declaração de privacidade.</li>
                        <li>Verificar também que os contratos entre as partes possuem cláusulas específicas sobre adequação à LGPD, exigências e detalhes sobre como coletamos e processamos seus dados.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 11. Cookies */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">11. COOKIES OU DADOS DE NAVEGAÇÃO</h3>
                  <p className="text-muted-foreground mb-3">
                    A Samel faz uso de Cookies, que são arquivos de texto enviados pela plataforma ao seu computador e que nele se armazenam informações relacionadas à navegação do site. Em suma, os Cookies são utilizados para aprimorar a experiência de uso.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    Ao acessar nosso site e consentir com o uso de Cookies, você manifesta conhecer e aceitar a utilização de um sistema de coleta de dados de navegação com o uso de Cookies em seu dispositivo.
                  </p>
                  <p className="text-muted-foreground">
                    Você pode, a qualquer tempo e sem nenhum custo, alterar as permissões, bloquear ou recusar os Cookies. Todavia, a revogação do consentimento de determinados Cookies pode inviabilizar o funcionamento correto de alguns recursos da plataforma.
                  </p>
                </div>

                {/* 12. Atualização desta Política */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">12. ATUALIZAÇÃO DESTA POLÍTICA</h3>
                  <p className="text-muted-foreground mb-3">
                    Nos reservamos ao direito de modificar essa Política de Privacidade a qualquer tempo, principalmente em função da adequação a eventuais alterações feitas em nosso site ou em âmbito legislativo. Recomendamos que você a revise com frequência.
                  </p>
                  <p className="text-muted-foreground">
                    Eventuais alterações entrarão em vigor a partir de sua publicação em nosso site e sempre lhe notificaremos acerca das mudanças ocorridas. Ao utilizar nossos serviços e fornecer seus dados pessoais após tais modificações, você as consente.
                  </p>
                </div>

                {/* 13. Encarregado de Proteção de Dados */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">13. ENCARREGADO DE PROTEÇÃO DE DADOS</h3>
                  <p className="text-muted-foreground mb-3">
                    A Samel nomeou dois profissionais como Encarregados de Proteção de Dados Pessoais ou Data Protection Officer (DPO) para a gestão da LGPD:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Responsáveis:</p>
                    <p>Ana Lúcia Macêdo de Lacerda - Samel Serviços de Assistência Médico Hospitalar Ltda.</p>
                    <p>Larissa Gomes Alves - Samel Plano de Saúde Ltda</p>
                    <p className="mt-3">
                      O Usuário pode entrar em contato com um dos DPO's no seguinte endereço eletrônico: <a href="mailto:dpo@samel.com.br" className="text-primary hover:underline">dpo@samel.com.br</a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>
        
        <DialogFooter className="shrink-0 px-4 sm:px-6 py-4 border-t bg-card">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
