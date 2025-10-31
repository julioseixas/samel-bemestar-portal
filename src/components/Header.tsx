import { Heart, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  patientName?: string;
  profilePhoto?: string;
}

export const Header = ({ patientName = "Maria Silva", profilePhoto }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary md:text-2xl">Hospital Samel</h1>
            <p className="text-xs text-muted-foreground md:text-sm">Portal do Paciente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Olá,</p>
            <p className="text-base font-semibold text-foreground md:text-lg">{patientName}</p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-primary">
            {profilePhoto ? (
              <AvatarImage src={`data:image/jpeg;base64,${profilePhoto}`} alt={patientName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
