import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export const AppSidebar = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (data) {
      try {
        setPatientData(JSON.parse(data));
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }
  }, []);

  return (
    <aside className="w-80 bg-gradient-to-br from-primary via-primary to-primary/90 p-6 flex flex-col">
      {/* Logo Samel */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Samel</h1>
            <p className="text-xs opacity-90">Saúde</p>
          </div>
        </div>
      </div>

      {/* Card do paciente */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full bg-card/95 backdrop-blur-sm border-none shadow-card p-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary">
              {profilePhoto ? (
                <AvatarImage src={`data:image/jpeg;base64,${profilePhoto}`} alt={patientData?.nm_pessoa_fisica} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg text-foreground">
                {patientData?.nm_pessoa_fisica || "Carregando..."}
              </h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p className="uppercase tracking-wide">Carteirinha Digital</p>
                <p className="font-mono">{patientData?.cd_pessoa_fisica || "000000000"}</p>
              </div>
            </div>

            <Button 
              variant="default" 
              className="w-full bg-primary hover:bg-primary-hover"
            >
              EDITAR DADOS
            </Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};
