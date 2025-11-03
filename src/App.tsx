import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ExamResults from "./pages/ExamResults";
import LabExams from "./pages/LabExams";
import CdiExams from "./pages/CdiExams";
import PrescriptionsAndCertificates from "./pages/PrescriptionsAndCertificates";
import CertificatesList from "./pages/CertificatesList";
import PrescriptionsList from "./pages/PrescriptionsList";
import AppointmentSchedule from "./pages/AppointmentSchedule";
import AppointmentDetails from "./pages/AppointmentDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/exam-results" element={<ExamResults />} />
            <Route path="/lab-exams" element={<LabExams />} />
            <Route path="/cdi-exams" element={<CdiExams />} />
            <Route path="/prescriptions-and-certificates" element={<PrescriptionsAndCertificates />} />
            <Route path="/certificates" element={<CertificatesList />} />
            <Route path="/prescriptions" element={<PrescriptionsList />} />
          <Route path="/appointment-schedule" element={<AppointmentSchedule />} />
          <Route path="/appointment-details" element={<AppointmentDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
