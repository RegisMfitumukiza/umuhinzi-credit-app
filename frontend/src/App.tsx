import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { AppLayout } from "./layouts/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { FinanceLayout } from "./layouts/FinanceLayout";
import { GovernmentLayout } from "./layouts/GovernmentLayout";
import { CooperativeLayout } from "./layouts/CooperativeLayout";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

import { DashboardPage } from "./pages/DashboardPage";
import { FarmsPage } from "./pages/FarmsPage";
import { FarmDetailPage } from "./pages/FarmDetailPage";
import { LoansPage } from "./pages/LoansPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { FinancePage } from "./pages/FinancePage";
import { MarketPricesPage } from "./pages/MarketPricesPage";
import { CreditScorePage } from "./pages/CreditScorePage";
import { CooperativePage } from "./pages/CooperativePage";
import { LivestockPage } from "./pages/LivestockPage";
import { ProductivityPage } from "./pages/ProductivityPage";

import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminFarmersPage } from "./pages/AdminFarmersPage";
import { AdminInstitutionsPage } from "./pages/AdminInstitutionsPage";
import { AdminCooperativesPage } from "./pages/AdminCooperativesPage";
import { AdminMarketPricesPage } from "./pages/AdminMarketPricesPage";
import { AdminSeasonsPage } from "./pages/AdminSeasonsPage";
import { AdminLoansPage } from "./pages/AdminLoansPage";
import { AdminRecommendationsPage } from "./pages/AdminRecommendationsPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";

import { FinanceDashboardPage } from "./pages/FinanceDashboardPage";
import { InstitutionProfilePage } from "./pages/InstitutionProfilePage";
import { GovernmentDashboardPage } from "./pages/GovernmentDashboardPage";
import { CooperativeDashboardPage } from "./pages/CooperativeDashboardPage";
import { RoleProfilePage } from "./pages/RoleProfilePage";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Farmer routes */}
          <Route
            element={
              <ProtectedRoute roles={["FARMER"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:id" element={<FarmDetailPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/finances" element={<FinancePage />} />
            <Route path="/credit-score" element={<CreditScorePage />} />
            <Route path="/market-prices" element={<MarketPricesPage />} />
            <Route path="/cooperative" element={<CooperativePage />} />
            <Route path="/livestock" element={<LivestockPage />} />
            <Route path="/productivity" element={<ProductivityPage />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/farmers" element={<AdminFarmersPage />} />
            <Route path="/admin/institutions" element={<AdminInstitutionsPage />} />
            <Route path="/admin/cooperatives" element={<AdminCooperativesPage />} />
            <Route path="/admin/market-prices" element={<AdminMarketPricesPage />} />
            <Route path="/admin/seasons" element={<AdminSeasonsPage />} />
            <Route path="/admin/loans" element={<AdminLoansPage />} />
            <Route path="/admin/recommendations" element={<AdminRecommendationsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>

          {/* Institution routes */}
          <Route
            element={
              <ProtectedRoute roles={["INSTITUTION"]}>
                <FinanceLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/finance" element={<FinanceDashboardPage />} />
            <Route path="/finance/institution" element={<InstitutionProfilePage />} />
            <Route path="/finance/profile" element={<RoleProfilePage />} />
          </Route>

          {/* Government routes */}
          <Route
            element={
              <ProtectedRoute roles={["GOVERNMENT_PARTNER"]}>
                <GovernmentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/government" element={<GovernmentDashboardPage />} />
            <Route path="/government/profile" element={<RoleProfilePage />} />
          </Route>

          {/* Cooperative routes */}
          <Route
            element={
              <ProtectedRoute roles={["COOPERATIVE_MANAGER"]}>
                <CooperativeLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/cooperatives" element={<CooperativeDashboardPage />} />
            <Route path="/cooperatives/profile" element={<RoleProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
