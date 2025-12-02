import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PaginationEllipsis,
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }
    
    pages.push(totalPages);
    
    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl truncate min-w-0 flex-1">Tabela de Preços</CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/coparticipation-choice")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm flex-shrink-0"
                size="sm"
              >
                Voltar
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Confira os valores de coparticipação por procedimento
              </p>

              {loading ? (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-[120px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : coparticipationData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum dado de coparticipação encontrado.</p>
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

                  <hr className="mb-4 border-border" />

                  {filteredData.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum procedimento encontrado com o termo "{searchTerm}".
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                              <TableHead>Nome do Procedimento</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentItems.map((item, index) => (
                              <TableRow key={`${item.IE_PROC_INTERNO}-${index}`} className="hover:bg-muted/50">
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

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
                        {currentItems.map((item, index) => (
                          <div 
                            key={`mobile-${item.IE_PROC_INTERNO}-${index}`}
                            className="p-3 border rounded-lg bg-card"
                          >
                            <p className="text-sm font-medium text-foreground mb-2 break-words">
                              {item.DS_PROCEDIMENTO}
                            </p>
                            <p className="text-base font-semibold text-primary">
                              {item.VL_PROCEDIMENTO_MONEY}
                            </p>
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <>
                          <hr className="my-4 border-border" />
                          <div>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                              
                              {getPageNumbers().map((page, i) => (
                                <PaginationItem key={`${page}-${i}`}>
                                  {typeof page === 'number' ? (
                                    <PaginationLink
                                      onClick={() => handlePageChange(page)}
                                      isActive={currentPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  ) : (
                                    <PaginationEllipsis />
                                  )}
                                </PaginationItem>
                              ))}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CoparticipationPriceTable;
