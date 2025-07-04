
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import ProductCreate from "./pages/ProductCreate";
import ProductEdit from "./pages/ProductEdit";
import AffiliateBrowseProducts from "./pages/AffiliateBrowseProducts";
import ReferralRedirect from "./pages/ReferralRedirect";
import ClearReferralLinks from "./pages/ClearReferralLinks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route
                    path="/products/create"
                    element={
                      <ProtectedRoute>
                        <ProductCreate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/:id/edit"
                    element={
                      <ProtectedRoute>
                        <ProductEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/affiliate/browse-products"
                    element={
                      <ProtectedRoute>
                        <AffiliateBrowseProducts />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/ref/:code" element={<ReferralRedirect />} />
                  <Route path="/admin/clear-links" element={<ClearReferralLinks />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
