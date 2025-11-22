import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CoparticipationItem {
  IE_PROC_INTERNO: number;
  DS_PROCEDIMENTO: string;
  DS_PROCED_PROCED: string;
  VL_PROCEDIMENTO: number;
  VL_PROCEDIMENTO_MONEY: string;
}

const CoparticipationPriceTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [coparticipationData, setCoparticipationData] = useState<CoparticipationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }

    fetchCoparticipationData();
  }, []);

  const fetchCoparticipationData = async () => {
    try {
      setLoading(true);
      const headers = getApiHeaders();
      
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/Cliente/Coparticipacao/precosProcedimentosCoparticipacao",
        {
          method: "GET",
          headers,
        }
      );

      const result = await response.json();

      if (result.sucesso) {
        setCoparticipationData(result.dados || []);
      } else {
        toast({
          title: "Erro",
          description: result.mensagem || "Não foi possível carregar os dados de coparticipação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados de coparticipação:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = coparticipationData.filter((item) =>
    item.DS_PROCEDIMENTO.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Tabela de Preços
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/coparticipation-choice")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Confira os valores de coparticipação por procedimento
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : coparticipationData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de coparticipação encontrado.
            </div>
          ) : (
            <>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por procedimento..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum procedimento encontrado com o termo "{searchTerm}".
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Procedimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentItems.map((item, index) => (
                          <TableRow key={`${item.IE_PROC_INTERNO}-${index}`}>
                            <TableCell className="font-medium">
                              {item.DS_PROCEDIMENTO}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.VL_PROCEDIMENTO_MONEY}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {renderPaginationItems()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CoparticipationPriceTable;
