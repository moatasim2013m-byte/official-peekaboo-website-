import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useTranslation } from "./i18n/useT";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TicketsPage from "./pages/TicketsPage";
import BirthdayPage from "./pages/BirthdayPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import ProfilePage from "./pages/ProfilePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import ReceptionPage from "./pages/ReceptionPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import GroupsPage from "./pages/GroupsPage";
import HomePartyPage from "./pages/HomePartyPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import RulesPage from "./pages/RulesPage";
import PricingPage from "./pages/PricingPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false, parentOnly = false }) => {
  const { isAuthenticated, isAdmin, isStaff, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin trying to access parent-only routes → redirect to /admin
  if (parentOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Non-admin trying to access admin-only routes → redirect to home
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Non-staff trying to access staff-only routes → redirect to home
  if (staffOnly && !isStaff && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children, isCustomerPage = true }) => {
  return (
    <div className={`flex flex-col min-h-screen ${isCustomerPage ? 'sky-theme' : ''}`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

// Admin Layout (no sky theme)
const AdminLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-light">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

function AppRoutes() {
  // Initialize translation at app root to set lang/dir
  useTranslation();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
      <Route path="/forgot-password" element={<Layout><ForgotPasswordPage /></Layout>} />
      <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />
      <Route path="/tickets" element={<Layout><TicketsPage /></Layout>} />
      <Route path="/birthday" element={<Layout><BirthdayPage /></Layout>} />
      <Route path="/subscriptions" element={<Layout><SubscriptionsPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/refund" element={<Layout><RefundPage /></Layout>} />
      <Route path="/groups" element={<Layout><GroupsPage /></Layout>} />
      <Route path="/home-party" element={<Layout><HomePartyPage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/rules" element={<Layout><RulesPage /></Layout>} />
      <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
      
      {/* Payment Routes */}
      <Route path="/payment/success" element={<Layout><PaymentSuccessPage /></Layout>} />
      <Route path="/payment/cancel" element={<Layout><PaymentCancelPage /></Layout>} />
      <Route path="/booking-confirmation" element={<Layout><BookingConfirmationPage /></Layout>} />

      {/* Protected Routes - Parent Only */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute parentOnly>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout><AdminPage /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout><AdminPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute staffOnly>
            <AdminLayout><StaffPage /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reception"
        element={
          <ProtectedRoute staffOnly>
            <AdminLayout><ReceptionPage /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/*"
        element={
          <ProtectedRoute staffOnly>
            <AdminLayout><StaffPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reception"
        element={
          <ProtectedRoute staffOnly>
            <Layout><ReceptionPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-center" 
          richColors 
          toastOptions={{
            className: 'font-body',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
