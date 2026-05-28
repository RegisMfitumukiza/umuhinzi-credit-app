import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { CooperativeLayout } from "./layout/CooperativeLayout";
import { LoginPage } from "./pages/LoginPage";
import { FarmDashboardPage } from "./pages/FarmDashboardPage";
import { FinancialDashboardPage } from "./pages/FinancialDashboardPage";
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
import { CooperativeApplicationsPage } from "./pages/CooperativeApplicationsPage";
import { CooperativeRiskAnalyticsPage } from "./pages/CooperativeRiskAnalyticsPage";
import { CooperativeReportsPage } from "./pages/CooperativeReportsPage";
import { CooperativeApplicationDetailsPage } from "./pages/CooperativeApplicationDetailsPage";
import { InstitutionsPage } from "./pages/InstitutionsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { InputCostsPage } from "./pages/InputCostsPage";
import { LivestockPage } from "./pages/LivestockPage";
import { RegisterRolePage } from "./pages/RegisterRolePage";
import { RegisterPersonalPage } from "./pages/RegisterPersonalPage";
import { LandingPage } from "./pages/LandingPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLayout } from "./layout/AdminLayout";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";
import { FinanceLayout } from "./layout/FinanceLayout";
import { FinanceDashboardPage } from "./pages/FinanceDashboardPage";
import { FinanceApplicationsPage } from "./pages/FinanceApplicationsPage";
import { GovernmentLayout } from "./layout/GovernmentLayout";
import { GovernmentDashboardPage } from "./pages/GovernmentDashboardPage";
import { RequireAuth, RedirectAuthenticated } from "./components/RouteGuards";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<RedirectAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route>
        <Route path="/register" element={<RegisterRolePage />} />
        <Route path="/register/personal" element={<RegisterPersonalPage />} />
      </Route>

      <Route element={<RedirectAuthenticated />}>
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route element={<RequireAuth roles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["INSTITUTION"]} />}>
        <Route element={<FinanceLayout />}>
          <Route path="/finance" element={<FinanceDashboardPage />} />
          <Route path="/finance/applications" element={<FinanceApplicationsPage />} />
          <Route path="/finance/portfolio" element={<FinanceDashboardPage />} />
          <Route path="/finance/reports" element={<FinanceDashboardPage />} />
          <Route path="/finance/profile" element={<FinanceDashboardPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["GOVERNMENT_PARTNER"]} />}>
        <Route element={<GovernmentLayout />}>
          <Route path="/government" element={<GovernmentDashboardPage />} />
          <Route path="/government/regions" element={<GovernmentDashboardPage />} />
          <Route path="/government/reports" element={<GovernmentDashboardPage />} />
          <Route path="/government/profile" element={<GovernmentDashboardPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["FARMER"]} />}>
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
      </Route>

      <Route element={<RequireAuth roles={["COOPERATIVE_MANAGER"]} />}>
        <Route element={<CooperativeLayout />}>
          <Route path="/cooperatives" element={<CooperativesPage />} />
          <Route path="/cooperatives/applications" element={<CooperativeApplicationsPage />} />
          <Route path="/cooperatives/applications/:id" element={<CooperativeApplicationDetailsPage />} />
          <Route path="/cooperatives/risk-analytics" element={<CooperativeRiskAnalyticsPage />} />
          <Route path="/cooperatives/groups" element={<CooperativesPage />} />
          <Route path="/cooperatives/regional-map" element={<CooperativesPage />} />
          <Route path="/cooperatives/reports" element={<CooperativeReportsPage />} />
          <Route path="/cooperatives/member-list" element={<CooperativesPage />} />
          <Route path="/cooperatives/loan-status" element={<CooperativesPage />} />
          <Route path="/cooperatives/productivity" element={<CooperativesPage />} />
          <Route path="/cooperatives/settings" element={<CooperativesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
