import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SessionRestorer } from "@/components/SessionRestorer";
import { AndroidThemeSync } from "@/components/AndroidThemeSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupDetails from "./pages/SignupDetails";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ExamResults from "./pages/ExamResults";
import ExamRequestChoice from "./pages/ExamRequestChoice";
import LabExamRequests from "./pages/LabExamRequests";
import ImageExamRequests from "./pages/ImageExamRequests";
import LabExams from "./pages/LabExams";
import CdiExams from "./pages/CdiExams";
import PrescriptionsAndCertificates from "./pages/PrescriptionsAndCertificates";
import CertificatesList from "./pages/CertificatesList";
import PrescriptionsList from "./pages/PrescriptionsList";
import AppointmentSchedule from "./pages/AppointmentSchedule";
import AppointmentDetails from "./pages/AppointmentDetails";
import AppointmentDetailsV2 from "./pages/AppointmentDetailsV2";
import AppointmentProfessionals from "./pages/AppointmentProfessionals";
import AppointmentTimes from "./pages/AppointmentTimes";
import ExamSchedule from "./pages/ExamSchedule";
import ExamDetails from "./pages/ExamDetails";
import ExamProfessionals from "./pages/ExamProfessionals";
import ExamTimes from "./pages/ExamTimes";
import ScheduledAppointmentsChoice from "./pages/ScheduledAppointmentsChoice";
import ScheduledAppointments from "./pages/ScheduledAppointments";
import ScheduledExams from "./pages/ScheduledExams";
import TermsToSign from "./pages/TermsToSign";
import TermsList from "./pages/TermsList";
import PersonalData from "./pages/PersonalData";
import PrescriptionRenewalSchedule from "./pages/PrescriptionRenewalSchedule";
import PrescriptionRenewalDetails from "./pages/PrescriptionRenewalDetails";
import HospitalizationSchedule from "./pages/HospitalizationSchedule";
import HospitalizationOptions from "./pages/HospitalizationOptions";
import SurgicalTracking from "./pages/SurgicalTracking";
import PrescriptionsTracking from "./pages/PrescriptionsTracking";
import ContactHospitalization from "./pages/ContactHospitalization";
import EvaluateProfessional from "./pages/EvaluateProfessional";
import CoparticipationChoice from "./pages/CoparticipationChoice";
import CoparticipationPriceTable from "./pages/CoparticipationPriceTable";
import OnlineConsultationSchedule from "./pages/OnlineConsultationSchedule";
import OnlineConsultationDetails from "./pages/OnlineConsultationDetails";
import TelemedicineQueue from "./pages/TelemedicineQueue";
import RateAppointments from "./pages/RateAppointments";
import AppointmentHistory from "./pages/AppointmentHistory";
import QueueChoice from "./pages/QueueChoice";
import EmergencyQueue from "./pages/EmergencyQueue";
import ExamQueue from "./pages/ExamQueue";
import ExamQueueDetails from "./pages/ExamQueueDetails";
import ConsultationQueue from "./pages/ConsultationQueue";
import ConsultationQueueDetails from "./pages/ConsultationQueueDetails";
import Units from "./pages/Units";
import VideoConsultation from "./pages/VideoConsultation";
import SmartScheduling from "./pages/SmartScheduling";

const queryClient = new QueryClient();

// Helper para envolver rotas protegidas
const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AndroidThemeSync>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionRestorer />
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/details" element={<SignupDetails />} />
            <Route path="/redefinirsenha/:hash" element={<ResetPassword />} />
            
            {/* Rotas Protegidas */}
            <Route path="/dashboard" element={<Protected><Index /></Protected>} />
            <Route path="/exam-results" element={<Protected><ExamResults /></Protected>} />
            <Route path="/exam-request-choice" element={<Protected><ExamRequestChoice /></Protected>} />
            <Route path="/lab-exam-requests" element={<Protected><LabExamRequests /></Protected>} />
            <Route path="/image-exam-requests" element={<Protected><ImageExamRequests /></Protected>} />
            <Route path="/lab-exams" element={<Protected><LabExams /></Protected>} />
            <Route path="/cdi-exams" element={<Protected><CdiExams /></Protected>} />
            <Route path="/prescriptions-and-certificates" element={<Protected><PrescriptionsAndCertificates /></Protected>} />
            <Route path="/certificates" element={<Protected><CertificatesList /></Protected>} />
            <Route path="/prescriptions" element={<Protected><PrescriptionsList /></Protected>} />
            <Route path="/appointment-schedule" element={<Protected><AppointmentSchedule /></Protected>} />
            <Route path="/appointment-details" element={<Protected><AppointmentDetails /></Protected>} />
            <Route path="/appointment-details-v2" element={<Protected><AppointmentDetailsV2 /></Protected>} />
            <Route path="/appointment-professionals" element={<Protected><AppointmentProfessionals /></Protected>} />
            <Route path="/appointment-times" element={<Protected><AppointmentTimes /></Protected>} />
            <Route path="/smart-scheduling" element={<Protected><SmartScheduling /></Protected>} />
            <Route path="/exam-schedule" element={<Protected><ExamSchedule /></Protected>} />
            <Route path="/exam-details" element={<Protected><ExamDetails /></Protected>} />
            <Route path="/exam-professionals" element={<Protected><ExamProfessionals /></Protected>} />
            <Route path="/exam-times" element={<Protected><ExamTimes /></Protected>} />
            <Route path="/scheduled-appointments-choice" element={<Protected><ScheduledAppointmentsChoice /></Protected>} />
            <Route path="/scheduled-appointments" element={<Protected><ScheduledAppointments /></Protected>} />
            <Route path="/scheduled-exams" element={<Protected><ScheduledExams /></Protected>} />
            <Route path="/terms-to-sign" element={<Protected><TermsToSign /></Protected>} />
            <Route path="/terms-list/:patientId" element={<Protected><TermsList /></Protected>} />
            <Route path="/personal-data" element={<Protected><PersonalData /></Protected>} />
            <Route path="/prescription-renewal-schedule" element={<Protected><PrescriptionRenewalSchedule /></Protected>} />
            <Route path="/prescription-renewal-details" element={<Protected><PrescriptionRenewalDetails /></Protected>} />
            <Route path="/hospitalization-schedule" element={<Protected><HospitalizationSchedule /></Protected>} />
            <Route path="/hospitalization-options" element={<Protected><HospitalizationOptions /></Protected>} />
            <Route path="/surgical-tracking" element={<Protected><SurgicalTracking /></Protected>} />
            <Route path="/prescriptions-tracking" element={<Protected><PrescriptionsTracking /></Protected>} />
            <Route path="/contact-hospitalization" element={<Protected><ContactHospitalization /></Protected>} />
            <Route path="/evaluate-professional" element={<Protected><EvaluateProfessional /></Protected>} />
            <Route path="/coparticipation-choice" element={<Protected><CoparticipationChoice /></Protected>} />
            <Route path="/coparticipation-price-table" element={<Protected><CoparticipationPriceTable /></Protected>} />
            <Route path="/online-consultation-schedule" element={<Protected><OnlineConsultationSchedule /></Protected>} />
            <Route path="/online-consultation-details" element={<Protected><OnlineConsultationDetails /></Protected>} />
            <Route path="/telemedicine-queue" element={<Protected><TelemedicineQueue /></Protected>} />
            <Route path="/rate-appointments" element={<Protected><RateAppointments /></Protected>} />
            <Route path="/appointment-history" element={<Protected><AppointmentHistory /></Protected>} />
            <Route path="/queue-choice" element={<Protected><QueueChoice /></Protected>} />
            <Route path="/emergency-queue" element={<Protected><EmergencyQueue /></Protected>} />
            <Route path="/exam-queue" element={<Protected><ExamQueue /></Protected>} />
            <Route path="/exam-queue-details" element={<Protected><ExamQueueDetails /></Protected>} />
            <Route path="/consultation-queue" element={<Protected><ConsultationQueue /></Protected>} />
            <Route path="/consultation-queue-details" element={<Protected><ConsultationQueueDetails /></Protected>} />
            <Route path="/units" element={<Protected><Units /></Protected>} />
            <Route path="/video-consultation" element={<Protected><VideoConsultation /></Protected>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AndroidThemeSync>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
