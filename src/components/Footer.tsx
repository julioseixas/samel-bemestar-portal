import { Phone, Mail, MapPin } from "lucide-react";
import samelLogo from "@/assets/samel-logo.png";

export const Footer = () => {
  return (
    <footer className="mt-8 sm:mt-16 border-t bg-card">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:px-6 md:py-12">
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                <img src={samelLogo} alt="Portal do Paciente" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold text-primary">Portal do Paciente</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cuidando da sua saúde com excelência e dedicação.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contato</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(92) 2125-5555</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contato@samel.com.br</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Unidades</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>Av. Djalma Batista, 1661 - Chapada, Manaus/AM</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Hospital Samel. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
