import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupDetails from "./pages/SignupDetails";
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
import CoparticipationChoice from "./pages/CoparticipationChoice";
import CoparticipationPriceTable from "./pages/CoparticipationPriceTable";
import OnlineConsultationSchedule from "./pages/OnlineConsultationSchedule";
import OnlineConsultationDetails from "./pages/OnlineConsultationDetails";
import TelemedicineQueue from "./pages/TelemedicineQueue";
import RateAppointments from "./pages/RateAppointments";

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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/details" element={<SignupDetails />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/exam-results" element={<ExamResults />} />
          <Route path="/exam-request-choice" element={<ExamRequestChoice />} />
          <Route path="/lab-exam-requests" element={<LabExamRequests />} />
          <Route path="/image-exam-requests" element={<ImageExamRequests />} />
            <Route path="/lab-exams" element={<LabExams />} />
            <Route path="/cdi-exams" element={<CdiExams />} />
            <Route path="/prescriptions-and-certificates" element={<PrescriptionsAndCertificates />} />
            <Route path="/certificates" element={<CertificatesList />} />
            <Route path="/prescriptions" element={<PrescriptionsList />} />
          <Route path="/appointment-schedule" element={<AppointmentSchedule />} />
          <Route path="/appointment-details" element={<AppointmentDetails />} />
          <Route path="/appointment-professionals" element={<AppointmentProfessionals />} />
          <Route path="/appointment-times" element={<AppointmentTimes />} />
          <Route path="/exam-schedule" element={<ExamSchedule />} />
          <Route path="/exam-details" element={<ExamDetails />} />
          <Route path="/exam-professionals" element={<ExamProfessionals />} />
          <Route path="/exam-times" element={<ExamTimes />} />
          <Route path="/scheduled-appointments-choice" element={<ScheduledAppointmentsChoice />} />
          <Route path="/scheduled-appointments" element={<ScheduledAppointments />} />
          <Route path="/scheduled-exams" element={<ScheduledExams />} />
          <Route path="/terms-to-sign" element={<TermsToSign />} />
          <Route path="/terms-list/:patientId" element={<TermsList />} />
          <Route path="/personal-data" element={<PersonalData />} />
          <Route path="/prescription-renewal-schedule" element={<PrescriptionRenewalSchedule />} />
          <Route path="/prescription-renewal-details" element={<PrescriptionRenewalDetails />} />
          <Route path="/hospitalization-schedule" element={<HospitalizationSchedule />} />
          <Route path="/coparticipation-choice" element={<CoparticipationChoice />} />
          <Route path="/coparticipation-price-table" element={<CoparticipationPriceTable />} />
          <Route path="/online-consultation-schedule" element={<OnlineConsultationSchedule />} />
          <Route path="/online-consultation-details" element={<OnlineConsultationDetails />} />
          <Route path="/telemedicine-queue" element={<TelemedicineQueue />} />
          <Route path="/rate-appointments" element={<RateAppointments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
