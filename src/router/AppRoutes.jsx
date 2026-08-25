// src/router/AppRoutes.jsx

import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/protected-route/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

import { LoginPage } from "../pages/authentication/LoginPage";
import { RegisterPage } from "../pages/authentication/RegisterPage";
import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";

import { DashboardPage } from "../pages/DashboardPage";
import { DashboardPageAll } from "../pages/DashboardPageAll";
import { Home } from "../pages/Home";
import { SignInPage } from "../pages/authentication/SignInPage";

import TestPage from "../pages/test pages/TestPage";

import { UserProfile } from "../pages/profile/UserProfile";
import { ChangePassword } from "../pages/profile/ChangePassword";

// ============ BLIL Module Imports ============

import { DashboardPage as BlilDashboardPage } from "../pages/blil/dashboard/DashboardPage";
import { OwnersList } from "../pages/blil/owners/OwnersList";
import { LiftList } from "../pages/blil/lifts/LiftList";
import { ServiceList } from "../pages/blil/services/ServiceList";
import { ApprovalList } from "../pages/blil/approvals/ApprovalList";
import { PaymentList } from "../pages/blil/payments/PaymentList";
import { ReportsPage } from "../pages/blil/reports/ReportsPage";
import { CollectionDuesReport } from "../pages/blil/reports/CollectionDuesReport";  
import { ServiceCompletionReport } from "../pages/blil/reports/ServiceCompletionReport";

import { AdvanceLedgerReport } from "../pages/blil/reports/AdvanceLedgerReport";
import { ZoneSummaryReport } from "../pages/blil/reports/ZoneSummaryReport";
import { CustomerStatementReport } from "../pages/blil/reports/CustomerStatementReport";
import { PortalHome } from "../pages/portal/PortalHome";
import { PortalHistory } from "../pages/portal/PortalHistory";
import { PortalChangePassword } from "../pages/portal/PortalChangePassword";
const AppRoutes = () => {
  const { isLoading } = useAuth();

  // Show loading spinner while checking authentication state
  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signin" element={<SignInPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <Home />
            </ProtectedRoute>
          }
        />

        

        {/* -------------- User Profile ---------------- */}

        <Route
          path="/user-profile"
          element={
            <ProtectedRoute allowedRoles={["D", "H"]}>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={["D", "H"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        
        {/* -------------- Test Page ---------------- */}

        <Route
          path="/test-page"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <TestPage />
            </ProtectedRoute>
          }
        />

        {/* ============ BLIL Module Routes ============ */}

      

        <Route
          path="/blil/owners"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <OwnersList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/lifts"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <LiftList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/services"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <ServiceList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/approvals"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <ApprovalList />
            </ProtectedRoute>
          }
        />  

        <Route
          path="/blil/payments"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <PaymentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/reports"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blil/reports/collection-dues"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <CollectionDuesReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/reports/service"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <ServiceCompletionReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/reports/advance"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <AdvanceLedgerReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/reports/zone"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <ZoneSummaryReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blil/reports/customer"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <CustomerStatementReport />
            </ProtectedRoute>
          }
        />
        {/* ============================== */}

        <Route
          path="/portal"
          element={<PortalHome />}
        />

        <Route
          path="/portal/history"
          element={<PortalHistory />}
        />

        <Route
          path="/portal/change-password"
          element={<PortalChangePassword />}
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard-all"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <DashboardPageAll />
            </ProtectedRoute>
          }
        />
        <Route
  path="/blil/dashboard"
  element={
    <ProtectedRoute allowedRoles={["H", "D"]}>
      <BlilDashboardPage />
    </ProtectedRoute>
  }
/>

        {/* Catch all route - redirect to home if authenticated, else to login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["H", "D"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>

    </>
  );
};

export default AppRoutes;