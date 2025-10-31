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
    <aside className="w-80 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-8 flex flex-col relative overflow-hidden">
      {/* Decorative background patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-32 -translate-x-32" />
      
      {/* Logo Samel */}
      <div className="relative mb-12 animate-fade-in">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg">
            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Samel</h1>
            <p className="text-sm opacity-90">Saúde</p>
          </div>
        </div>
      </div>

      {/* Card do paciente */}
      <div className="relative flex-1 flex items-center justify-center animate-scale-in">
        <Card className="w-full bg-white/98 backdrop-blur-md border-none shadow-2xl rounded-3xl p-8 hover:shadow-3xl transition-shadow duration-300">
          <div className="flex flex-col items-center space-y-6">
            {/* Avatar with ring effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl ring-4 ring-primary/20">
                {profilePhoto ? (
                  <AvatarImage src={`data:image/jpeg;base64,${profilePhoto}`} alt={patientData?.nm_pessoa_fisica} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl">
                  <User className="h-14 w-14" strokeWidth={1.5} />
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* User info with better hierarchy */}
            <div className="text-center space-y-3 w-full">
              <h3 className="font-bold text-xl text-foreground tracking-tight">
                {patientData?.nm_pessoa_fisica || "Carregando..."}
              </h3>
              <div className="space-y-1.5 pt-2 pb-2 px-4 bg-muted/30 rounded-xl">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Carteirinha Digital
                </p>
                <p className="font-mono text-base font-bold text-primary">
                  {patientData?.cd_pessoa_fisica || "000000000"}
                </p>
              </div>
            </div>

            {/* Button with modern styling */}
            <Button 
              variant="default" 
              className="w-full bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all duration-300 font-semibold py-6 rounded-xl"
            >
              EDITAR DADOS
            </Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};
