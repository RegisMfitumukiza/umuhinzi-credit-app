import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { CooperativeLayout } from "./layout/CooperativeLayout";
import { LoginPage } from "./pages/LoginPage";
import { FarmDashboardPage } from "./pages/FarmDashboardPage";
import { FinancialDashboardPage } from "./pages/FinancialDashboardPage";
import { FarmListPage } from "./pages/FarmListPage";
import { FarmCreatePage } from "./pages/FarmCreatePage";
import { FarmEditPage } from "./pages/FarmEditPage";
import { FarmDetailsPage } from "./pages/FarmDetailsPage";
import { LoansPage } from "./pages/LoansPage";
import { LoanDetailsPage } from "./pages/LoanDetailsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CooperativesPage } from "./pages/CooperativesPage";
import { InstitutionsPage } from "./pages/InstitutionsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { InputCostsPage } from "./pages/InputCostsPage";
import { LivestockPage } from "./pages/LivestockPage";
import { RegisterRolePage } from "./pages/RegisterRolePage";
import { RegisterPersonalPage } from "./pages/RegisterPersonalPage";
import { RegisterFarmPage } from "./pages/RegisterFarmPage";
import { RegisterVerifyPage } from "./pages/RegisterVerifyPage";
import { LandingPage } from "./pages/LandingPage";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterRolePage />} />
      <Route path="/register/personal" element={<RegisterPersonalPage />} />
      <Route path="/register/farm" element={<RegisterFarmPage />} />
      <Route path="/register/verify" element={<RegisterVerifyPage />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<FinancialDashboardPage />} />
        <Route path="/farms" element={<FarmDashboardPage />} />
        <Route path="/farms/new" element={<FarmCreatePage />} />
        <Route path="/farms/:id" element={<FarmDetailsPage />} />
        <Route path="/farms/:id/edit" element={<FarmEditPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/loans/:id" element={<LoanDetailsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/institutions" element={<InstitutionsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/input-costs" element={<InputCostsPage />} />
        <Route path="/livestock" element={<LivestockPage />} />
      </Route>

      <Route element={<CooperativeLayout />}>
        <Route path="/cooperatives" element={<CooperativesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
