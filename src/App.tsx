import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Landing & Auth Pages
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import Wallet from "./pages/customer/Wallet";
import Deposit from "./pages/customer/Deposit";
import Packages from "./pages/customer/Packages";
import MyPackages from "./pages/customer/MyPackages";
import Earnings from "./pages/customer/Earnings";
import Withdraw from "./pages/customer/Withdraw";
import WithdrawalHistory from "./pages/customer/WithdrawalHistory";
import TransactionHistory from "./pages/customer/TransactionHistory";
import Profile from "./pages/customer/Profile";
import Notifications from "./pages/customer/Notifications";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCustomers from "./pages/admin/Customers";
import AdminCustomerDetail from "./pages/admin/CustomerDetail";
import AdminDeposits from "./pages/admin/Deposits";
import AdminWithdrawals from "./pages/admin/Withdrawals";
import AdminPackages from "./pages/admin/Packages";
import AdminTransactions from "./pages/admin/Transactions";
import AdminAuditLogs from "./pages/admin/AuditLogs";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, isCustomer = true }: { children: React.ReactNode; isCustomer?: boolean }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, is_customer")
          .eq("id", session.user.id)
          .single();

        if (isCustomer) {
          setIsAuthorized(profile?.is_customer === true);
        } else {
          setIsAuthorized(profile?.is_admin === true);
        }
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isCustomer]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthorized) return <Navigate to="/login" replace />;

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Customer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isCustomer={true}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/wallet" element={<ProtectedRoute isCustomer={true}><Wallet /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute isCustomer={true}><Deposit /></ProtectedRoute>} />
          <Route path="/packages" element={<ProtectedRoute isCustomer={true}><Packages /></ProtectedRoute>} />
          <Route path="/my-packages" element={<ProtectedRoute isCustomer={true}><MyPackages /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute isCustomer={true}><Earnings /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute isCustomer={true}><Withdraw /></ProtectedRoute>} />
          <Route path="/withdrawal-history" element={<ProtectedRoute isCustomer={true}><WithdrawalHistory /></ProtectedRoute>} />
          <Route path="/transaction-history" element={<ProtectedRoute isCustomer={true}><TransactionHistory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute isCustomer={true}><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute isCustomer={true}><Notifications /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute isCustomer={false}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/customers" element={<ProtectedRoute isCustomer={false}><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/customers/:id" element={<ProtectedRoute isCustomer={false}><AdminCustomerDetail /></ProtectedRoute>} />
          <Route path="/admin/deposits" element={<ProtectedRoute isCustomer={false}><AdminDeposits /></ProtectedRoute>} />
          <Route path="/admin/withdrawals" element={<ProtectedRoute isCustomer={false}><AdminWithdrawals /></ProtectedRoute>} />
          <Route path="/admin/packages" element={<ProtectedRoute isCustomer={false}><AdminPackages /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute isCustomer={false}><AdminTransactions /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute isCustomer={false}><AdminAuditLogs /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
