import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './shared/layouts/PublicLayout'
import DashboardLayout from './shared/layouts/DashboardLayout'

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('./features/auth/pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'))

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'))

const LoansPage = lazy(() => import('./features/loans/pages/LoansPage'))
const LoanDetailPage = lazy(() => import('./features/loans/pages/LoanDetailPage'))
const LoanApplicationPage = lazy(() => import('./features/loans/pages/LoanApplicationPage'))

const RepaymentsPage = lazy(() => import('./features/repayments/pages/RepaymentsPage'))

const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'))
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/loans/apply" element={<LoanApplicationPage />} />
            <Route path="/loans/:id" element={<LoanDetailPage />} />
            <Route path="/repayments" element={<RepaymentsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
